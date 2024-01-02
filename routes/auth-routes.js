const express = require("express");
const authRouter = express.Router();
const { authController } = require("../controllers");   

authRouter.post("/sign-up", authController.signUp);
authRouter.post("/email-verification",authController.emailVerification);
authRouter.post("/sign-in/email", authController.signInWithEmail);
authRouter.post("/sign-in/username", authController.signInWithUsername);
authRouter.post("/forget-password", authController.forgetPassword);
authRouter.post("/verify-otp", authController.verifyOtp);
authRouter.post("/resend-otp", authController.resendOtp);
authRouter.post("/continue-without-changing-password", authController.continueWithoutChangingPassword);
authRouter.post("/change-password", authController.changePassword);
authRouter.post("/refresh-access-token", authController.refreshAccessToken);
authRouter.get("/google/login" , authController.googleLogin);
authRouter.get("/google/auth" , authController.googleOauthHandler);

module.exports = authRouter;