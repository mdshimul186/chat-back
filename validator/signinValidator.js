const validator = require('validator')
const siginValidator = (email, password) => {
    error = {}


    if (!email) {
        error.email = 'Please provide your email'
    } else if (!validator.isEmail(email)) {
        error.email = 'Please provide your valid email'
    }
    if (!password) {
        error.password = 'Please provide a password'
    }

    return {
        error,
        isError: Object.keys(error).length == 0
    }
}

module.exports = siginValidator