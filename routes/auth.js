const express = require('express')
const route = express.Router()
const User = require('../model/auth.model')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {usersignin} = require('../middleware/auth.middleware')

const registerValidator = require('../validator/signupValidator')
const signinValidator = require('../validator/signinValidator')
const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { v4: uuidv4 } = require('uuid');
const validator = require('validator')
 
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

route.post('/signup', (req, res)=>{
    const {first, last, email, password,confirm} = req.body
    const register = registerValidator(first,last, email, password, confirm)

    if(!register.isError){
        return res.status(404).json(error)
    }else{
        User.findOne({email})
        .then(user=>{
            
            if(user){
               return res.status(400).json({error: 'User already registered'})
            }

            bcrypt.genSalt(10, (err, salt)=>{
                bcrypt.hash(password, salt, (err, hash)=>{
                    const newUser = new User({
                        first, last, email, password : hash, username:uuidv4()
                    })
        
                    newUser.save()
                    .then(user=>{
                        res.status(200).json({
                            first: user.firstName,
                            last: user.lastName,
                            email: user.email,
                        })
                    })
                    .catch(err=>res.status(400).json({error:"something went wrong"}))
                
                })
            })
               
            
        })
        .catch(err=>console.log('no user')
        )
        
    }

   
    
    
})


route.post('/signin', (req,res)=>{
    const {email, password} = req.body
    const login = signinValidator(email, password)
    if(!login.isError){
        res.status(400).json(error)
    }else{
        User.findOne({email})
        .then(user=>{
            
            if(!user){
                return res.status(400).json({error: 'User not found'})
            }
            bcrypt.compare(password, user.password,(err, result)=>{
                if(err){
                   return res.status(400).json({error: 'Email or Password invalid'})
                }
                if(!result){
                   return res.status(400).json({ error: 'Password invalid' })
                }

                var userdetails = {
                    _id:user._id,
                    first: user.first,
                    last: user.last,
                    email: user.email,
                    username: user.username,
                    
                    
                }
                jwt.sign(userdetails, process.env.JWT_SECRET,(err,token)=>{
                    if(err){
                        return res.status(400).json({error: 'server error'})
                    }
                    
                    res.status(200).json({token,user:userdetails,profileimg:user.profileimg,success: true})
                })
            })
        })
        
    }


})


route.put('/profileimg',usersignin,upload.single('profileimg'),(req,res)=>{
    const file = req.file
    User.findByIdAndUpdate(req.user._id,{$set:{profileimg:file.path}},{new:true})
    .select('-password')
    .then(user=>{
        let newpost = new Post({
            post:'',user: user._id, image:user.profileimg,activity:'Updated profile photo'
        })
        newpost.save()
        Post.populate(newpost,{path:"user",select:"_id first last email"})
        .then(post=>{
            res.status(200).json({post,user:user})
        })
    })
})


route.put('/coverimg',usersignin,upload.single('coverimg'),(req,res)=>{
    const file = req.file
    User.findByIdAndUpdate(req.user._id,{$set:{coverimg:file.path}},{new:true})
    .select('-password')
    .then(user=>{
        let newpost = new Post({
            post:'',user: user._id, image:user.coverimg,activity:'Updated cover photo'
        })
        newpost.save()
        Post.populate(newpost,{path:"user",select:"_id first last email"})
        .then(post=>{
            res.status(200).json({post,user:user})
        })
    })
})

route.get('/profile',usersignin,(req,res)=>{
    User.findById(req.user._id)
    .select('-password')
    .then(user=>{
        res.status(200).json({user})
    })
})







route.put('/update',usersignin,(req,res)=>{
    let setobj={
        first:req.body.first,
        last:req.body.last,
        bio:req.body.bio,
        gender:req.body.gender,
        city:req.body.city,
        country:req.body.country,
        state:req.body.state,
        dateofbirth:req.body.dateofbirth,
        email:req.body.email,
        username:req.body.username
    }

    if (!req.body.email) {
        return res.status(404).json({error:"Please provide your email"})
        
    } else if (!validator.isEmail(req.body.email)) {
        return res.status(404).json({error:"Invalid email"})
  
    }
    if (!req.body.username) {
        return res.status(404).json({error:"Username can't be empty"})
        
    } 
    

    User.findOne({email:req.body.email})
    .then(useremail=>{
        if(useremail && (useremail._id != req.user._id)){
           return res.status(404).json({error:"Email already taken"})
        }
        User.findOne({username:req.body.username})
        .then(username=>{
            if(username && (username._id != req.user._id)){
                return res.status(404).json({error:"Username is not available, try another"})
             }

             User.findByIdAndUpdate(req.user._id,{$set:setobj},{new:true})
            .select('-password')
            .then(user=>{
                res.status(200).json({user,message:"saved successfully"})
            })
        })
    })
    

})

//password change api
route.patch('/changepassword',usersignin,(req,res)=>{
    const {currentpassword, newpassword, confirmpassword} = req.body
    if(!currentpassword){
        return res.status(400).json({error: 'please provide current password'})
    }
     if(!newpassword){
        return res.status(400).json({error: 'please provide new password'})
     }else if(newpassword.length < 6){
        return res.status(400).json({error: 'password should not be less then six letter'})
     }

     if(!confirmpassword){
        return res.status(400).json({error: 'please provide confirm password'})
     }else if(newpassword !== confirmpassword){
        return res.status(400).json({error: 'confirm password did not matched'})
     }

        User.findById(req.user._id)
        .then(user=>{
            bcrypt.compare(currentpassword, user.password,(err, result)=>{
                if(err){
                   return res.status(400).json({error: 'something went wrong, try again'})
                }
                if(!result){
                   return res.status(400).json({ error: 'Password invalid' })
                }
        
        
        
                bcrypt.genSalt(10, (err, salt)=>{
                    bcrypt.hash(newpassword, salt, (err, hash)=>{
                       
                        User.findByIdAndUpdate(user._id,{$set:{password:hash}},{new:true})
                        .then(newuser=>{
                            res.status(200).json({message:"password changed successfuly"})
                        })
                    
                    })
                })
        
        
            })
        })
    
})


route.delete('/delete',usersignin,(req,res)=>{
    User.findById(req.user._id)
    .then(user=>{
        let images = []
        let posts = []

        Post.find({user:user._id})
        .then(userpost=>{
            userpost.map(p=>{
                
                posts.push(p._id)
                p.image.map(img=>{
                    let id = img.split('/').pop()
                    images.push((id.split('.')[0]));
                })
            })



            if(user.profileimg){
                let id = user.profileimg.split('/').pop()
                images.push((id.split('.')[0]));
        
              }
        
              if(user.coverimg){
                let id = user.coverimg.split('/').pop()
                images.push((id.split('.')[0]));
        
              }

              user.deleteOne()
              .then(udelete=>{
                 Post.deleteMany({_id: { $in: posts}})
                 .then(pdelete=>{
                   cloudinary.api.delete_resources(images,function(error, result) {
                     console.log(result);
                     res.status(200).json({success:true})
                 });
                 })
              })
              

            
        })

        
    })
})


route.get("/alluser",usersignin,(req,res)=>{
    User.find({_id:{$ne:req.user._id}})
    .select('-passowrd')
    .then(user=>{
        res.status(200).json({seccess:true,user})
    })
})
module.exports = route