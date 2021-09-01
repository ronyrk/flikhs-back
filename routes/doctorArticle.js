const express = require('express')
const route = express.Router()
const DoctorArticle = require('../model/doctorArticle.model')
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const slugify = require('slugify')
const shortid = require('shortid')
const { usersignin,moderator } = require('../middleware/auth.middleware');
var ObjectId = require('mongoose').Types.ObjectId;

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {},
});

var upload = multer({ storage: storage })
//---------------------------------------------------------------------------------------------------------------
route.post("/create", usersignin, upload.single('thumbnail'), (req, res) => {
    const { title, description, body, article1, article2, article3, tags } = req.body

    const file = req.file

    if (!file) {
        return res.status(400).json({ error: "Thumbnail is required " })
    }

    if (!title) {
        return res.status(400).json({ error: "Title should be more then 10 words " })
    }
    if (!description) {
        return res.status(400).json({ error: "Description should be more then 32 words " })
    }
    
    if (!body) {
        return res.status(400).json({ error: "Article body is required" })
    }

    let obj ={
        creator: req.user._id,
        title,
        description,
        slug: slugify(title + "-" + shortid.generate(), {
            locale: "bn"
        }),
        body,
        thumbnail: file.path,
        tags: tags ? tags.split(',') : []
    }


    let _article = new DoctorArticle(obj)

    _article.save()
    .then(blog => {
        res.status(201).json({ sucess: true })
    })
    .catch(err => {
        //console.log(err);
        res.status(400).json({ error: "something went wrong" })
    })
})


//---------------------------------------------------------------------------------------------------------------
route.patch('/editarticle/:articleid', usersignin, moderator, upload.single('thumbnailedit'), (req, res) => {
    const { status, title, description, body, tags } = req.body
    const file = req.file
    let articleId = req.params.articleid

    let options = {}

    if (file) {
        options.thumbnail = file.path
    }
    if (title != 'null') {
        options.title = title
        options.slug = slugify(title + "-" + shortid.generate())
    }
    if (description) {
        options.description = description
    }
    if (body) {
        options.body = body
    }
    if (tags) {
        options.tags = tags ? tags.split(',') : []
    }
   
    if (!articleId) {
        return res.status(400).json({ error: "Article id is required" })
    }

    if (!title || !description ) {
        return res.status(400).json({ error: "Article title,description,category,status is required" })
    }


    DoctorArticle.findByIdAndUpdate(articleId, { $set: options }, { new: true })
        .populate("creator", "first last _id email username profileimg")
        .then(article => {
            res.status(200).json({ success: true, article })
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ error: "something went wrong" })
        })
})



//---------------------------------------------------------------------------------------------------------------
route.patch('/index/:id', usersignin, moderator, (req, res) => {
    let articleId = req.params.id
    let isIndex = req.body.isIndex

    DoctorArticle.findByIdAndUpdate(articleId, { $set: { isIndex } }, { new: true })
        .populate("creator", "first last _id email username profileimg")
        .then(article => {
            res.status(200).json({ success: true, article })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})


//---------------------------------------------------------------------------------------------------------------
route.delete('/deletearticle/:articleid', usersignin, moderator, (req, res) => {

    let articleId = req.params.articleid
    DoctorArticle.findByIdAndDelete(articleId)
        .then(article => {
            res.status(200).json({ success: true })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})


//---------------------------------------------------------------------------------------------------------------
route.get('/recentarticle', (req, res) => {
   

    DoctorArticle.find()
    .populate("creator", "first last _id email username profileimg")
    .sort("-createdAt")
    .limit(34)
    .then(article => {
        res.status(200).json({ sucess: true, article })

    })
    .catch(err => {
        res.status(400).json({ error: "something went wrong" })
    })
})



//---------------------------------------------------------------------------------------------------------------
route.get('/allarticles', usersignin, moderator, (req, res) => {
    
    DoctorArticle.find()
        .populate("creator", "first last _id email username profileimg")
        .sort("-createdAt")
        .then(articles => {
            res.status(200).json({ success: true, articles })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})
//---------------------------------------------------------------------------------------------------------------
route.get('/single/:slug', (req, res) => {
    DoctorArticle.findOne({ slug: req.params.slug, isApproved: true })
        .populate("creator", "first last _id email username profileimg")
        .then(article => {
            if (!article) {
                return res.status(400).json({ error: "article not found" })
            }
            res.status(200).json({ sucess: true, article })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.post('/relatedarticles', (req, res) => {
    const { tags, _id } = req.body
    console.log( req.body);
    DoctorArticle.find(
        { "tags": { $in: tags[0] !== '' ? tags : [] }, "_id": { $ne: ObjectId.isValid(_id) ? _id : undefined }, isApproved: true })
        .limit(3)
        .populate("creator", "first last _id email username profileimg")
        .then((article) => {

            res.status(200).json({ sucess: true, article })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})


//-------------------------------------------------------------------------------------------------------------------------------------------------
route.patch('/updateview/:slug', (req, res) => {
    
    DoctorArticle.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } }, { new: true })
        .populate("creator", "first last _id email username profileimg")
        .then(article => {
            if (!article) {
                return res.status(400).json({ error: "article not found" })
            }
            res.status(200).json({ sucess: true, article })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})


//---------------------------------------------------------------------------------------------------------------
route.get("/search", (req, res) => {
    let query = {}
    let text = req.query.search || ''

    if (text.length) {
        query["$text"] = { $search: text }
    }

    DoctorArticle.find(query)
        .populate("creator", "first last _id email username profileimg")
        .then(article => {
            res.status(200).json({ sucess: true, article })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})



module.exports = route