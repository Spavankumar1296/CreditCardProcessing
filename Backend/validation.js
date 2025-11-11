const zod = require("zod")

const SignupValidation = zod.object({
    FirstName:zod.string(),
    LastName:zod.string(),
    Email:zod.string().email(),
    Password:zod.string()
})

const SigninValidation = zod.object({
    Email:zod.string().email(),  
    Password:zod.string()
})
const UpdateValidation = zod.object({
    FirstName:zod.string(),
    LastName:zod.string(),
    Password:zod.string()
})


module.exports = {
    SigninValidation:SigninValidation,
    SignupValidation:SignupValidation,
    UpdateValidation:UpdateValidation,
}