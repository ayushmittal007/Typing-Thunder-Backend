const express = require("express");
const userRouter = express.Router();
const { userController } = require("../controllers");
const auth = require("../middlewares/auth");

userRouter.post("/save-performance", auth ,userController.savePerformance);
userRouter.get("/get-performance", auth ,userController.getPerformance);
userRouter.patch("/update-user", auth ,userController.updateUsername);
userRouter.get("/get-user", auth ,userController.getUser);

module.exports = userRouter;