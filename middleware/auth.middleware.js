const jwt = require('jsonwebtoken')
const usersignin = (req, res, next) =>{
    let token = req.headers.authorization
    if(token){
        var decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()

    }else{
        res.status(400).json({error: 'Not authorized'})
    }
}

const admin = (req, res, next) =>{
    let user = req.user
    if(user.role == 'admin'){
        next()
    }else{
        res.status(400).json({error: 'Admin required'})
    }
}
const moderator = (req, res, next) =>{
    let user = req.user
    if(user.role == 'admin'||user.role === 'moderator'){
        next()
    }else{
        res.status(400).json({error: 'access denied'})
    }
}
module.exports = {usersignin, admin,moderator}