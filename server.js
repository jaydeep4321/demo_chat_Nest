const express = require('express');
const app = express();
const fs = require('fs');
const http = require('http');
const Blob = require('blob');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server , {
  //transports : ["polling"],
  transports : ["websocket"],
  //transports : [ "polling" ,"websocket" ],
  //transports : ["websocket" , "polling"],

  cors: {
    origin: "*"
  }
});

app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
  //console.log(req);  
  res.sendFile(__dirname + '/index.html');
    
});

app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/chat.html');
});

let users = {};
let chat_history = [];

io.on('connection', (socket) => {
  console.log("transport 1: ", socket.conn.transport.name);
  // socket.on("join_room" , (data) => {
  //   socket.join(data);
  //   socket.to(data).emit('user-joined', {msg: 'joined' , user: users[socket.id], room: data});

  // })

  // socket.on("connect_error", () => {
  //   // revert to classic upgrade
  //   socket.io.opts.transports = ["polling", "websocket"];
  // });

  //-----------------------------------------------------------------------------------------------------------

  socket.on('room', async(data , ack) => {
    console.log("transport : ", socket.conn.transport.name);
    
    console.log(data);
    console.log("before:",users);
    //let user = users.values(data.uname)
    //console.log("user:",user); 
    // if( user == data.uname){
    //   console.log("in if:",users);
    // }else {
    let exists = Object.values(users).includes(data.uname);
    console.log("exists :",exists);
    if(!exists){
      users[socket.id] = data.uname;
      users.room = data.room;
    }else{
      await ack(chat_history)
    }

    //console.log("after:",users[socket.id]);
    socket.join(data.room);
    socket.emit('welcome-to-room' ,  { msg: `welcome to room - ${data.room}` , time: data.time , room: data.room });
    socket.to(data.room).emit('user-joined-room', {msg: 'joined room' , user: data.uname , time: data.time});
  });

  // socket.on('new-user-joined', (name) => {
  //   users[socket.id] = name; 
  //   socket.emit('user-joined', { msg: 'joined' , user: users[socket.id] });
  // });  
  
  socket.on('leave-room', (data) => {
    socket.leave(data.room);
    socket.to(data.room).emit('left', { msg:`${data.user} has left` ,time : data.time , room: data.room});
    //socket.broadcast.emit('left', { msg: 'left' , user: users[socket.id] });
  });

  socket.on('typing', (data) => {
    //socket.to(data.room).emit('typing' , `${users[socket.id]} is typing...`);
    socket.to(data.room).emit('typing' , `${users[socket.id]} is typing...`);

  });
  
  // to all connected clients
  socket.on('send-chat', (data) => {
    console.log(data);
    //data.user = users[socket.id]
    chat_history.push(data)
    console.log("Chat History : ", chat_history);
    socket.to(data.room).emit('receive-chat', {msg: data.msg , user: data.user, time: data.time });
    //socket.broadcast.emit('receive-chat', {msg: payload , user: users[socket.id]});
  });

  // to all connected clients
  // socket.on('send-chat', (data) => {
  //   console.log(data);
  //   chat_history.push(data)
  //   socket.to(data.room).emit('receive-chat', {msg: data.msg , user: users[socket.id] , time: data.time });
  //   //socket.broadcast.emit('receive-chat', {msg: payload , user: users[socket.id]});
  // });

  socket.on('disconnect', (data) => {
    console.log(data);
    chat_history = []
    //socket.emit('left', {msg: 'left' , user: users[socket.id]});
    socket.emit('left', {msg: 'left' , user: users[socket.id]});
  });

  socket.on('base64 file', function (data) {
    //console.log('received base64 file from' + msg.file);
    //socket.username = msg.username;
    // socket.broadcast.emit('base64 image', //exclude sender
    io.in(data.room).emit('base64 file',getFileData(data));
  });
  
})

server.listen(3000, () => {
  console.log('listening on *:3000');
});

function getFileData(data){
  let binary = Buffer.from(data.file).toString('base64'); //or Buffer.from(data, 'binary')

  let file_data = {
    user: data.username,
    file: `data:image/png;base64,${binary}`,
    fileName: data.fileName,
    time: data.time,
    room:data.room
  }
  chat_history.push(file_data)
  return file_data;
}
