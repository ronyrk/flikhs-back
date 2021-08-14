const express = require('express')
const route = express.Router()
const { usersignin } = require('../middleware/auth.middleware')
const Chat = require('../model/chat.model')
const Message = require('../model/message.model')
const User = require('../model/auth.model')
const mongoose = require('mongoose')
const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { v4: uuidv4 } = require('uuid');
const validator = require('validator')
const shortId = require('shortid')
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
    },
});

var upload = multer({ storage: storage })

route.post("/findorcreate/:otherid", usersignin, (req, res) => {
    let otherid = req.params.otherid
    Chat.findOneAndUpdate({
        users: {
            $all: [
                { $elemMatch: { $eq: mongoose.Types.ObjectId(req.user._id) } },
                { $elemMatch: { $eq: mongoose.Types.ObjectId(otherid) } },

            ]
        }
    },
        {
            $setOnInsert: {
                users: [req.user._id, otherid]
            }
        },
        {
            new: true,
            upsert: true
        }
    )
        .populate("users", "_id first last profileimg")
        .then(chat => {
            res.status(200).json({ chat })
        })
        .catch(err => {
            res.status(400).json({ error: 'something went wrong' })
        })
})



route.get("/mychats", usersignin, async (req, res) => {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
        .populate("users", "_id first last profileimg")
        .populate("latestMessage")
        .sort({ updatedAt: -1 })
        .then(async results => {

            // if(req.query.unreadOnly !== undefined && req.query.unreadOnly == "true") {
            //     results = results.filter(r => r.latestMessage && !r.latestMessage.readBy.includes(req.session.user._id));
            // }

            results = await User.populate(results, { path: "latestMessage.sender" });

            res.status(200).json({ chats: results })
        })
        .catch(error => {
            console.log(error);
            res.sendStatus(400);
        })
})


route.get("/:chatid/messages", usersignin, (req, res) => {
    var userId = req.user._id;
    var chatId = req.params.chatid;
    var isValidId = mongoose.isValidObjectId(chatId);

    if (!isValidId) {
        return res.status(400).json({ error: "Chat does not exist or you do not have permission to view it." })
    }


    Chat.findById(chatId)
        .populate("users", "_id first last profileimg")
        .then(async chat => {
            let users = [...chat.users]
            if (users.findIndex(u => u._id == userId) === -1) {
                return res.status(400).json({ error: "Chat does not exist or you do not have permission to view it." })
            }

            let newUpdated = await Chat.findByIdAndUpdate(chat._id, { $pull: { toRead: userId } }, { new: true }).exec()
            Message.find({ chat: chat._id })
                .populate('sender')
                .then(messages => {
                    res.status(200).json({ messages, chat })
                })


        })
})

route.put("/sendmessage/:chatid", usersignin, (req, res) => {
    let io = req.io
    const { type, content } = req.body
    var userId = req.user._id;
    var chatId = req.params.chatid;
    var isValidId = mongoose.isValidObjectId(chatId);

    if (!isValidId) {
        return res.status(400).json({ error: "Chat does not exist or you do not have permission to view it." })
    }
    if (!content) {
        return res.status(400).json({ error: "Message cannnot be empty" })
    }

    let data = {
        type: type || "text",
        sender: userId,
        content,
        chat: chatId
    }

    let _message = new Message(data)
    _message.save()
        .then(async message => {
            message = await message.populate("sender", "_id first last profileimg").execPopulate();
            Chat.findByIdAndUpdate(chatId, { $set: { latestMessage: message._id } }, { new: true })
                .populate("users", "_id first last profileimg")
                .populate("latestMessage")
                .then(async updated => {
                    let users = [...updated._doc.users]
                    let otheruser = users.filter(u => u._id.toString() !== userId)[0]
                    let newUpdated = await Chat.findByIdAndUpdate(updated._id, { $set: { toRead: otheruser._id } }, { new: true })
                        .populate("users", "_id first last profileimg")
                        .populate("latestMessage")
                        .exec()
                   //console.log(newUpdated);
                    //console.log(otheruser._id.toString());
                    io.in(otheruser._id.toString()).emit("newmessage", { chat: { ...newUpdated._doc, latestMessage: message } })
                    res.status(200).json({ message })
                })
        })
        .catch(err => {
            console.log(err);
        })
})



route.put("/sendimage/:chatid", usersignin, upload.single('chatimage'), (req, res) => {
    let io = req.io
    var userId = req.user._id;
    var chatId = req.params.chatid;
    var isValidId = mongoose.isValidObjectId(chatId);
    const file = req.file

    if (!isValidId) {
        return res.status(400).json({ error: "Chat does not exist or you do not have permission to view it." })
    }
    if (!file.path) {
        return res.status(400).json({ error: "Image sending failed" })
    }

    let data = {
        type: "image",
        sender: userId,
        content: file.path,
        chat: chatId
    }

    let _message = new Message(data)
    _message.save()
        .then(async message => {
            message = await message.populate("sender", "_id first last profileimg").execPopulate();
            Chat.findByIdAndUpdate(chatId, { $set: { latestMessage: message._id } })
                .populate("users", "_id first last profileimg")
                .populate("latestMessage")
                .then(updated => {
                    let users = [...updated.users]
                    let otheruser = users.filter(u => u._id !== userId)[0]
                    io.in(otheruser._id.toString()).emit("newmessage", { chat: { ...updated._doc, latestMessage: message } })
                    res.status(200).json({ message })
                })
        })
        .catch(err => {
            console.log(err);
        })
})










module.exports = route