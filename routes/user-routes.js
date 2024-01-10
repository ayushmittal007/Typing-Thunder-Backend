const express = require("express");
const userRouter = express.Router();
const { userController } = require("../controllers");
const auth = require("../middlewares/auth");

userRouter.patch("/update-user", auth ,userController.updateUsername);
userRouter.get("/get-user", auth ,userController.getUser);
// userRouter.post("/analyze", auth,userController.analyzer);

module.exports = userRouter;