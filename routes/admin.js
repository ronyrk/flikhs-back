const express = require('express')
const route = express.Router()
const User = require('../model/auth.model')
const Article = require('../model/article.model')
const { usersignin, admin,moderator } = require('../middleware/auth.middleware')
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const slugify = require('slugify')
const shortId = require('shortid')
const Blog = require('../model/blog.model')
const registerValidator = require('../validator/signupValidator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid');
const Post = require('../model/post.model')

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {},
});

var upload = multer({ storage: storage })

//---------------------------------------------------------------------------------------------------------------
route.get('/allarticles', usersignin, moderator, (req, res) => {
    let options = {
        isApproved: true
    }
    if (req.query.isApproved == 'false') {
        options.isApproved = false
    }
    Article.find(options)
        .populate("category", "name slug _id")
        .populate("subCategory", "name slug _id")
        .populate("creator", "first last _id email username profileimg")
        .populate("blog")
        .sort("-createdAt")
        .then(articles => {
            res.status(200).json({ success: true, articles })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.patch('/editarticle/:articleid', usersignin, moderator, upload.single('thumbnailedit'), (req, res) => {
    const { status, title, description, body, category, subCategory, tags } = req.body
    const file = req.file
    let articleId = req.params.articleid

    let options = {}

    if (file) {
        options.thumbnail = file.path
    }
    if (title != 'null') {
        options.title = title
        options.slug = slugify(title + "-" + shortId.generate())
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
    if (category) {
        options.category = category
    }

    if (subCategory & subCategory != 'null') {
        options.subCategory = subCategory
    }
    if (!articleId) {
        return res.status(400).json({ error: "Article id is required" })
    }
    if (status) {
        if (status === 'approve') {
            options.isApproved = true
        } else {
            options.isApproved = false
        }
    }
    if (!title || !description || !category || !status) {
        return res.status(400).json({ error: "Article title,description,category,status is required" })
    }


    Article.findByIdAndUpdate(articleId, { $set: options }, { new: true })
        .populate("category", "name slug _id")
        .populate("subCategory", "name slug _id")
        .populate("creator", "first last _id email username profileimg")
        .populate("blog")
        .then(article => {
            res.status(200).json({ success: true, article })
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.delete('/deletearticle/:articleid', usersignin, moderator, (req, res) => {

    let articleId = req.params.articleid
    Article.findByIdAndDelete(articleId)
        .then(article => {
            res.status(200).json({ success: true })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.delete('/deleteblog/:blogid', usersignin, moderator, (req, res) => {

    let blogId = req.params.blogid
    Blog.findByIdAndDelete(blogId)
        .then(article => {
            res.status(200).json({ success: true })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.get('/users', usersignin, moderator, (req, res) => {

    let options = {
        role: "user"
    }
    if (req.query.type === 'admin-moderator') {
        options = { "$or": [{ role: 'admin' }, { role: "moderator" }] }
    }
    User.find(options)
        .sort('-date')
        .then(users => {
            res.status(200).json({ success: true, users })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})


//---------------------------------------------------------------------------------------------------------------
route.post('/signup', usersignin, admin, (req, res) => {
    const { first, last, email, password, confirm, role } = req.body
    console.log(role !== 'user' || role !== 'moderator');
    const register = registerValidator(first, last, email, password, confirm)

    if (!register.isError) {
        return res.status(404).json(error)
    } else if (role === 'user' || role === 'moderator') {
        User.findOne({ email })
            .then(user => {

                if (user) {
                    return res.status(400).json({ error: 'User already registered' })
                }

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(password, salt, (err, hash) => {
                        const newUser = new User({
                            first, last, email, password: hash, username: uuidv4(), role
                        })

                        newUser.save()
                            .then(user => {
                                res.status(201).json({
                                    first: user.firstName,
                                    last: user.lastName,
                                    email: user.email,

                                })
                            })
                            .catch(err => res.status(400).json({ error: "something went wrong" }))
                    })
                })
            })
            .catch(err => console.log('no user')
            )
    } else {
        return res.status(404).json({ error: "role must be user/moderator" })
    }
})

//---------------------------------------------------------------------------------------------------------------
route.patch('/updateuser/:userid', usersignin, admin, (req, res) => {
    let userId = req.params.userid

    User.findByIdAndUpdate(userId, { $set: { isSuspended: req.body.isSuspended, role: req.body.role } }, { new: true })
        .then(user => {
            res.status(200).json({ success: true, user })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})
//---------------------------------------------------------------------------------------------------------------
route.patch('/index/:id', usersignin, moderator, (req, res) => {
    let articleId = req.params.id
    let isIndex = req.body.isIndex

    Article.findByIdAndUpdate(articleId, { $set: { isIndex } }, { new: true })
        .populate("category", "name slug _id")
        .populate("subCategory", "name slug _id")
        .populate("creator", "first last _id email username profileimg")
        .populate("blog")
        .then(article => {
            res.status(200).json({ success: true, article })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//--------------------------------------------------------------------------------------------------------------
route.get('/total',async(req,res)=>{
    try {
        const users = await User.countDocuments()
        const posts = await Post.countDocuments()
        const blogs = await Blog.countDocuments()
        const articles = await Article.countDocuments()
        res.status(200).json({ users, posts, blogs, articles })
      } catch (error) {
        res.status(400).json({ error: "something went wrong" })
      }
    
})

module.exports = route