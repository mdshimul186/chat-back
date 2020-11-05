const validator = require('validator')
const registerValidator = (first, last,email, password, confirmPassword) => {
    error = {}
    

    if(!first){
        error.first = 'Please provide first name'
    }
    if(!last){
        error.last = 'Please provide last name'
    }

    if(!email){
        error.email ='Please provide your email'
    }else if(!validator.isEmail(email)){
         error.email = 'Please provide your valid email'
    }
    if(!password){
        error.password = 'Please provide a password'
    }else if(password.length < 6){
        error.password = 'password should not be less then six'
    }
    if (!confirmPassword) {
        error.confirm = 'Please provide a confirm password'
    }else if(password !== confirmPassword){
        error.confirm = 'Confirm password didn\'t match'
    }

    return {
        error,
        isError : Object.keys(error).length == 0
    }
}

module.exports = registerValidator