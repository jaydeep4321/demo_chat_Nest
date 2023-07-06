//const socket = io()
const socket = io("http://localhost:3000", {
    transports: ["websocket"] // use WebSocket first, if available
    //transports: ["polling"]
    //transports: ["websocket", "polling"] // use WebSocket first, if available
});

let textarea = document.querySelector('#textarea')
let messageArea = document.querySelector('.message__area')

var form = document.getElementById('form');
var uploadImage = document.getElementById('file');
var showImage = document.getElementById('showImage');


var uname = localStorage.getItem('uname')
console.log(uname);
var room = localStorage.getItem('room')
console.log(room);

var st = document.getElementById('chat');

document.getElementById('h1').innerHTML = `Room -${room}`;




if(room){
    socket.emit('room' ,{ uname:uname , room: room , time : getTime() } ,async function(ack){
        //console.log("chat-data:",ack);
        for (let i = 0 ; i<=ack.length ; i++) {
            appendMessage(ack[i] , 'incoming');
        }
    } );
}
else{
    socket.emit('new-user-joined' ,{ uname:uname , time : getTime() } );
}

textarea.addEventListener('keyup', (e) => {
    if(e.key === 'Enter') {
        //console.log(e.target.value);
        sendMessage({iMessage:e.target.value , room : room , uname: uname})
    }
})

textarea.addEventListener('keypress', (e) => {
    if(e.key !== 'Enter') {
        socket.emit('typing' , { room : room });
    }
});

uploadImage.addEventListener('change', function(e){
    var data = e.target.files[0];
    console.log(data);
    //alert("Image uploaded")
    e.target.value = '';
    readThenSendFile(data);      
});


function leave() {
    alert('user leave.')
    socket.emit('leave-room', {user: uname, room : room , time: getTime()})
    location.href = '/'
}

function sendMessage(message) {
    console.log(message);
    let data= {
        time: getTime(),
        room: message.room,
        msg: message.msg || message.iMessage.trim(),
        user: message.uname
    }
    // Append 
    appendMessage(data, 'outgoing')
    textarea.value = ''
    st.innerHTML=''
    scrollToBottom()

    // Send to server 
    socket.emit('send-chat', data)

}

function appendMessage(data, type) {
    console.log("appendmessage", data);
    let mainDiv = document.createElement('div')
    let className = type
    mainDiv.classList.add(className, 'message')
    
    var markup;
    if(data.file && room == data.room){
        //console.log(`data:image/png;base64,${data.file}`);
        markup = `
            <img src=${data.file} width="200px"/>
            <div style = "margin-left:auto; font-size: smaller;">${data.time}</div>
            `
            // <img src=${data.file} width="200px"/>
    }
    else if((type == 'outgoing' && room == data.room) || (data.user == null && room == data.room)) {
        markup = `
            <p>${data.msg}</p>
            <div style = "margin-left:auto; font-size: smaller;">${data.time}</div>
        `
    } else {
        console.log("appendMessage time :",data);
        markup = `
            <p>${data.user} : ${data.msg} </p>
            <div style = "margin-left:auto; font-size: smaller;">${data.time}</div>
        `
    }
    mainDiv.innerHTML = markup
    messageArea.appendChild(mainDiv)
}

function getTime() {
    const d = new Date();
    const h = d.getHours();
    const m = (d.getMinutes()<=9) ? '0'+d.getMinutes() : d.getMinutes();
    if(h >=0 && h< 12 ){
        return h +':'+m+ ' am';
    }else{
        return h +':'+m+ ' pm';
    }
}

function readThenSendFile(data){

    var reader = new FileReader();
    reader.onload = function(evt){
        var msg ={};
        console.log("In read...:", evt);
        msg.username = uname;
        msg.file = evt.target.result;
        msg.fileName = data.name;
        msg.time = getTime();
        msg.room = room;
        socket.emit('base64 file', msg);
    };
    //console.log("");
    reader.readAsArrayBuffer(data);
    //reader.readAsDataURL(data); //encoded
}

// Recieve messages 

socket.on('user-joined', (data) => {
    //console.log("CLIENT:", data);
    appendMessage(data, 'incoming');
    scrollToBottom();
})
socket.on('user-joined-room', (data) => {
    console.log("CLIENT:", data);
    appendMessage(data, 'incoming');
    scrollToBottom();
})

socket.on('receive-chat', (payload) => {
    console.log("receive-chat:",payload);
    appendMessage(payload, 'incoming');
    scrollToBottom();
})

socket.on('welcome-to-room', (data) => {
    console.log("CLIENT:", data);
    //console.log(ack);
    appendMessage(data, 'incoming');
    scrollToBottom();
})


socket.on('left', (payload) => {
    console.log(payload);
    appendMessage(payload, 'incoming');
    scrollToBottom();
});

socket.on('typing', (data) => {
    console.log(data);
    st.innerHTML = data;
    setTimeout(()=> {
        st.innerHTML=''
    }, 3000)
});

socket.on('base64 file', (payload) => {
    console.log("file data:",payload);
    appendMessage(payload, 'incoming');
    scrollToBottom();
});


function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight
}

