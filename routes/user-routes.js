const express = require("express");
const userRouter = express.Router();
const { userController } = require("../controllers");
const auth = require("../middlewares/auth");

userRouter.get("/get-random-text" ,userController.getRandomText);
userRouter.get("/get-random-text-with-punctuations" ,userController.getRandomTextIncludingPunctuation);
userRouter.get("/get-random-text-with-numbers" ,userController.getRandomTextWithNumbers);
userRouter.post("/save-performance", auth ,userController.savePerformance);
userRouter.get("/get-performance", auth ,userController.getPerformances);
userRouter.patch("/update-user", auth ,userController.updateUsername);
userRouter.get("/get-user", auth ,userController.getUser);

module.exports = userRouter;