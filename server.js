const express = require('express')
const mongoose = require('mongoose')
const dotenv = require("dotenv");
dotenv.config();
const app = express()
const cors = require('cors')
app.use(cors())
const socketIo = require('socket.io')
// const server = require('http').createServer(app)
// const io = require("socket.io")(server, { pingTimeout: 60000 });

// io.set('origins', '*:*');



const path = require('path')
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

app.use(express.json())

app.use(express.urlencoded({ extended: false }))

mongoose.connect(process.env.DB_URL, { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify:true }, () => {
    console.log('DB connected');
})




let server = app.listen(process.env.PORT || 5000,(req,res)=>{
    console.log('server started');
})


const io = socketIo(server)
//  io.set('origins', '*:*');
app.use((req,res,next)=>{
    req.io = io
    next()
})

 

io.on('connection',(socket)=>{
    //socket.join("ball")
    console.log('user connected');
    socket.on("online",data=>{
       // console.log(data.id);
        socket.join(data.id)
    })
    socket.on("joinchat",data=>{
        socket.join(data.id)
    })
    

    socket.on("sendmessage",data=>{
        socket.to(data.chatid).emit("receive",{message:data.message})
    })
    socket.on('typing',(data)=>{
        socket.to(data.to).emit('istyping', data)
    })

    socket.on('disconnect',()=>{
        console.log('user disconnected');
    })
})










app.use('/user', require('./routes/auth'))
app.use('/post', require('./routes/post'))
app.use('/comment', require('./routes/comment'))
app.use('/group', require('./routes/group'))
app.use('/blogcategory', require('./routes/blogCategory'))
app.use('/blog', require('./routes/blog'))
app.use('/article', require('./routes/article'))
app.use('/admin', require('./routes/admin'))
app.use('/chat', require('./routes/chat'))
app.use('/notification', require('./routes/notofication'))
app.use('/report', require('./routes/report'))
app.use('/general', require('./routes/general'))
app.use('/doctor', require('./routes/doctor'))
app.use('/doctor/country', require('./routes/country'))
app.use('/doctor/department', require('./routes/department'))
app.use('/doctor/article', require('./routes/doctorArticle'))

app.get('/', (req, res) => {
    res.json({ message: "server is running..." })
})