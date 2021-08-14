const express = require('express')
const route = express.Router()
const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
    },
});

var upload = multer({ storage: storage })



//---------------------------------------------------------------------------------------------------------------
route.post('/image', upload.single('image'), (req, res) => {
    const file = req.file
    if(file){
        res.status(200).json({ success:true, image:file.path })
    }else{
        res.status(400).json({ error:"Upload failed" })
    }
   
})


module.exports = route