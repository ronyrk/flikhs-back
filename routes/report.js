const express = require('express')
const route = express.Router()
const { usersignin, admin,moderator } = require('../middleware/auth.middleware')
const Post = require('../model/post.model')
const Report = require('../model/report.model')

route.post('/submit/:id',usersignin,async(req,res)=>{
    let id = req.params.id
    let type = req.body.type
    try {
        let report = await Report.insertReport(id,req.user._id,type) 
        console.log(report);
        res.status(200).json({success:true})
    } catch (error) {
        console.log(error);
        res.status(400).json({error:"Something went wrong"})
    }
    
})


route.get('/allreports',usersignin,moderator,(req,res)=>{
    Report.find()
    .populate('post','slug')
    .populate('reportedBy','first last')
    .sort("-createdAt")
    .then(reports=>{
        res.status(200).json({reports})
    })
    .catch(err=>{
        res.status(400).json({error:"Something went wrong"})
    })
})

route.delete('/:id',usersignin,moderator,(req,res)=>{
    Report.findByIdAndDelete(req.params.id)
    .then(deleted=>{
        res.status(200).json({success:true})
    })
    .catch(err=>{
        console.log(err);
        res.status(400).json({error:"Something went wrong"})
    })
})

route.delete('/deletecontent/:id',usersignin,moderator,(req,res)=>{
    let id = req.params.id
    Post.findByIdAndDelete(id)
    .then(deleted=>{
        Report.deleteMany({post:id})
        .then(report=>{
            res.status(200).json({success:true})
        })
        .catch(err=>{
            res.status(400).json({error:"Something went wrong"})
        })
    })
    .catch(err=>{
        res.status(400).json({error:"Something went wrong"})
    })

})


module.exports = route