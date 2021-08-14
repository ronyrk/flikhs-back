const express = require('express')
const route = express.Router()
const { usersignin } = require('../middleware/auth.middleware')
const Notification = require('../model/notification.model')


route.get("/",usersignin, async (req, res, next) => {

    var searchObj = { userTo: req.user._id};

    if(req.query.unreadOnly !== undefined && req.query.unreadOnly == "true") {
        searchObj.opened = false;
    }
    
    Notification.find(searchObj)
    .populate("userTo", "_id first last profileimg")
    .populate("userFrom", "_id first last profileimg")
    .sort({ createdAt: -1 })
    .then(results => res.status(200).json({notifications:results}))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

})

route.patch("/markread/:notiid",usersignin,(req,res)=>{
    let notId = req.params.notiid
    Notification.findByIdAndUpdate(notId,{$set:{opened:true}},{new:true})
    .populate("userFrom", "_id first last profileimg")
    .then(noti=>{
        res.status(200).json({notification:noti})
    })
})


module.exports = route