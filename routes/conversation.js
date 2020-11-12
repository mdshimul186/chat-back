const express = require('express')
const route = express.Router()
const User = require('../model/auth.model')
const Conversation = require('../model/conversation.model')
const { usersignin } = require('../middleware/auth.middleware')

const cloudinary = require('cloudinary').v2;
const multer = require('multer')


const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        //folder: 'fbpost',
        //format: async (req, file) => 'png', // supports promises as well
        //public_id: (req, file) =>uuidv4()+"-"+file.originalname,
    },
});

var upload = multer({ storage: storage })

route.patch('/image/:conversationid', usersignin, upload.single('image'), (req, res) => {
    let io = req.io
    const file = req.file


    Conversation.findById(req.params.conversationid)
        .then(conversation => {
            if (conversation) {
                let rcv = ''
                let rcvid = ''
                conversation.member.map(m => {
                    if (m._id != req.user._id) {

                        rcv = m.username
                        rcvid = m._id
                    }
                })


                if (rcv !== '') {
                    Conversation.findOneAndUpdate({ _id: conversation._id }, { $push: { messages: { type: "image", sender: req.user._id, body: file.path } } }, { new: true })
                        .populate('member', "-password")
                        .populate({ path: 'messages.sender', model: "User" })
                        .then(con => {


                            io.to(rcvid).emit("newmessage", con)
                            io.to(req.user._id).emit("newmessage", con)
                            io.in(con._id).emit("newconversation", con.messages)
                            res.status(200).json({ messages: con.messages })
                        })
                }
            }



        })
})


route.patch('/sendtext/:conversationid', usersignin, (req, res) => {
    const { body, receiverid } = req.body
    let io = req.io

    Conversation.findById(req.params.conversationid)
        .then(conversation => {
            if (conversation) {
                let rcv = ''
                let rcvid = ''
                conversation.member.map(m => {
                    if (m._id != req.user._id) {

                        rcv = m.username
                        rcvid = m._id
                    }
                })


                if (rcv !== '') {
                    Conversation.findOneAndUpdate({ _id: conversation._id }, { $push: { messages: { type: "text", sender: req.user._id, body: body } } }, { new: true })
                        .populate('member', "-password")
                        .populate({ path: 'messages.sender', model: "User" })
                        .then(con => {

                           

                            io.to(rcvid).emit("newmessage", con)
                            io.to(req.user._id).emit("newmessage", con)
                            io.in(con._id).emit("newconversation", con.messages)
                            res.status(200).json({ messages: con.messages })
                        })
                }
            }



        })
})

route.post('/createconversation/:userid', usersignin, (req, res) => {
   
    Conversation.findOne({ $and: [{ member: req.params.userid }, { member: req.user._id }] })
        .then(conversation => {
            if (conversation) {
                return res.status(200).json({ id: conversation._id })

            }


            let newConversation = new Conversation({
                member: [req.user._id, req.params.userid],
                messages: []
            })
            newConversation.save()
                .then(con2 => {
                    res.status(200).json({ id: con2._id })
                })



        })
})


route.get('/find/:roomid', usersignin, (req, res) => {
    Conversation.findById(req.params.roomid)
        .populate('member', '-password')
        .populate({ path: 'messages.sender', model: "User" })
        .then(con => {
            if (!con) {
                return res.status(200).json({ seccess: false, messages: [], member: {} })
            }

            res.status(200).json({ seccess: true, messages: con.messages, member: con.member })

        })
})



route.get('/getall', usersignin, (req, res) => {
    Conversation.find({ member: { $in: [req.user._id] } })
        .populate("member", "-password")
        .then(con => {
            res.status(200).json({ seccess: true, conversations: con })
        })
})











module.exports = route