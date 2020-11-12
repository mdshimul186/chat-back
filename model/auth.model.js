const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    first: {
        type: String,
        trim: true,
        required:true
    },
    last:{
        type: String,
        trim: true,
        required:true
    },
    email:{
        type:String,
        trim: true,
        unique: true,
        lowercase: true,
        required:true       
    },
    username:{
        type:String,
        trim: true,
        unique: true,
        lowercase: true,
        default:""
    },
    password:{
        type: String,
        required:true
    },
    gender:{
        type: String,
        default:""
    },
    date:{
        type: Date,
        default: Date.now
    },
    profileimg:{
        type:String,
        default:''
    },
    status:{
        current:{type:String,default:"online"},
        lastonline:{type: String,default: Date.now.toString()}
        
    },
    favourites:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
        }]

},{timestamps:true})


const User = mongoose.model('User', userSchema)
module.exports = User