const Joi = require("joi");

const authSchema = Joi.object({
  username: Joi.string().min(4).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6)
  .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>])(?=.*[0-9]).{6,}$"))
  .required(),
});

const newSchema = Joi.object({
  email: Joi.string().email().trim().required(),
  newPassword: Joi.string().min(6)
  .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>])(?=.*[0-9]).{6,}$"))
  .required(),
});

module.exports = { 
    authSchema ,
    newSchema ,
};
