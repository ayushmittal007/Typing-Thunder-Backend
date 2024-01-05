const Joi = require("joi");

const signUpSchema = Joi.object({
  username: Joi.string().min(4).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6)
  .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>])(?=.*[0-9]).{6,}$"))
  .required(),
});

const emailVerificationSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  otp: Joi.string().length(6).required(),
});

const signInWithEmailSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).required(),
});

const signInWithUsernameSchema = Joi.object({
  username: Joi.string().min(4).trim().required(),
  password: Joi.string().min(6).required(),
});

const forgetPasswordSchema = Joi.object({
  email: Joi.string().email().trim().required(),
});

const newPasswordSchema = Joi.object({
  email: Joi.string().email().trim().required(),
  newPassword: Joi.string().min(6)
  .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>])(?=.*[0-9]).{6,}$"))
  .required(),
});

module.exports = { 
    signUpSchema ,
    emailVerificationSchema ,
    signInWithEmailSchema ,
    signInWithUsernameSchema ,
    forgetPasswordSchema ,
    newPasswordSchema ,
};
