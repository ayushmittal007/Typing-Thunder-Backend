const express = require("express");
const authRouter = express.Router();
const { authController } = require("../controllers");
const { auth } = require("googleapis/build/src/apis/abusiveexperiencereport");

authRouter.post("/sign-up", authController.signUp);
authRouter.post("/email-verification",authController.emailVerification);
authRouter.post("/sign-in", authController.signIn);
authRouter.post("/forget-password", authController.forgetPassword);
authRouter.post("/verify-otp", authController.verifyOtp);
authRouter.post("/resend-otp", authController.resendOtp);
authRouter.post("/change-password", authController.changePassword);
authRouter.post("/refresh-access-token", authController.refreshAccessToken);
authRouter.get("/google/login" , authController.googleLogin);
authRouter.get("/google/auth" , authController.googleOauthHandler);

module.exports = authRouter;