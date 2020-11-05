const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema({
    member:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    messages:[{
        type:{type:String,default:"text"},
        sender:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
        body:{type:String},
        date:{type:Date,default: Date.now}
    }],
    status:{
        type:String,
        default:""
    }

},{timestamps:true})


const Conversation = mongoose.model('Conversation', conversationSchema)
module.exports = Conversation