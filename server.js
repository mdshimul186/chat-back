const express = require('express')
const mongoose = require('mongoose')

const User = require('./model/auth.model')

const dotenv = require("dotenv");
dotenv.config();
const app = express()
const socketIo = require('socket.io')
const cors = require('cors')
app.use(cors())



const path = require('path')
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.CLOUD_API_KEY, 
    api_secret: process.env.CLOUD_API_SECRET
  });
   
app.use(express.json())

app.use(express.urlencoded({ extended: false }))


mongoose.connect(process.env.DB_URL,{useCreateIndex: true, useNewUrlParser: true ,useUnifiedTopology: true },()=>{
    console.log('DB connected');
})



let server = app.listen(process.env.PORT || 5000,(req,res)=>{
    console.log('server started');
})









const io = socketIo(server)
 io.set('origins', '*:*');

app.use((req,res,next)=>{
    req.io = io
    next()
})

var sockets = {}

function getChatSocket(socket){ 
    return sockets["chat-user-"+socket]; 
} 
 

function setChatSocket(socket, data){ 
    if (!("chat-user-"+socket in sockets)){
        sockets["chat-user-"+socket] = data; 
    }
   
    
} 
 
function deleteChatSocket(socket){ 
    delete sockets["chat-user-"+socket]; 
} 


let updateOnline=(userId,status,id)=>{
    
    User.findOneAndUpdate({_id:userId},{$set:{status:{current:status,lastonline:Date.now().toString()}}},{new:true})
    .then(user=>{
       if(id){

           io.sockets.connected[id].emit('imonline', true);
           
       }
       User.findById(userId)
       .select('-password')
       .then(user=>{
           
        io.emit('useronline', user);
       })
    })
}

//socket functionality starts from here
io.on('connection', function(socket){ 
        
    socket.on('come_online', function (userId) { 
        
        socket.join(userId)
        
        socket.soketid = userId; 
        if (!("chat-user-"+socket.soketid in sockets)){
            updateOnline(userId,"online",socket.id);
            setChatSocket(socket.soketid, socket); 
        }
    }); 

    socket.on('joinroom',(roomid)=>{
        socket.join(roomid)
        

    })

    socket.on('typing',(data)=>{
        socket.to(data.to).emit('istyping', data)
        

    })

    socket.on('callUser', (data)=>{
      
        socket.to(data.userToCall).emit('hey', {signal: data.signalData, from: data.from})
    })

    socket.on('acceptCall', (data)=>{
        
        io.to(data.to).emit('callAccepted', data.signal)
    })
         
    socket.on('disconnect', function() { 
        var userId = socket.soketid; 
        updateOnline(userId,"offline",false);
        deleteChatSocket(socket.soketid); 
           
    }); 
 
    // socket.on('chat_message', function (message, to, from) { 
    //     getChatSocket(to).emit('chat_message',message, from); 
    // }); 
});

module.exports ={getChatSocket,setChatSocket,deleteChatSocket}

app.use('/user', require('./routes/auth'))
app.use('/conversation', require('./routes/conversation'))


app.get('/',(req,res)=>{
    res.json({message:"workss"})
})