const express = require("express");
const GoogleAuthRouter = express.Router();
const { authController } = require("../controllers");   

GoogleAuthRouter.get("/google/login" , authController.googleLogin);
GoogleAuthRouter.get("/google/auth" , authController.googleOauthHandler);

module.exports = GoogleAuthRouter;