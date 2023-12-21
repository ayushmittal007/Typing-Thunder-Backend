const express = require("express");
const userRouter = express.Router();
const { userController } = require("../controllers");
const auth = require("../middlewares/auth");

userRouter.patch("/update-user", auth ,userController.updateUsername);

module.exports = userRouter;