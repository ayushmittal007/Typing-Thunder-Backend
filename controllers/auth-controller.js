const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const shortid = require("shortid");
const app = express();
app.use(express.json());
require("dotenv").config();

const { User , Otp } = require("../models");
const { sendmail } = require("../utils/send_mail");
const { ErrorHandler } = require("../middlewares/errorHandling");
const { authSchema , newSchema } = require("../utils/joi_validations");

const createAccessToken = ( payload ) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_KEY, {
    expiresIn: process.env.JWT_ACCESS_EXP,
  });
};

const createRefreshToken = ( payload ) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_KEY, {
    expiresIn: process.env.JWT_REFRESH_EXP,
  });
}

const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshtoken = req.body.refreshtoken;
    if (!refreshtoken)
      return next(new ErrorHandler(400, "Please Login or Register"));

    const payload = jwt.verify(refreshtoken, process.env.JWT_REFRESH_KEY);

    if(!payload) {
      return next(new ErrorHandler(400, "Invalid Refresh Token"));
    }
    
    payload.shortId = shortid.generate();
    await User.update(
      { shortId: payload.shortId },
      {
        where: {
          _id: payload.id,
        },
      }
    );

    const accesstoken = createAccessToken({ payload });
    return res.status(200).json({ suucces : true ,  data : { accesstoken } });

  } catch (err) {
    next(err);
  }
};

const signUp = async (req, res, next) => {
  try {
    const input = await authSchema.validateAsync(req.body);
    const username = input.username;
    const email = input.email;
    const password = input.password;

    const hashedPassword = await bcryptjs.hash(password, 6);

    let existingEmail = await User.findOne({ where: { email: email.toLowerCase() } });

    if (existingEmail) {
      if (!existingEmail.isVerified) {
        await existingEmail.update({
          username: username,
          email: email,
          password: hashedPassword,
        });
      } else {
        return next(new ErrorHandler(400, "User with this email already exists"));
      }
    } else {
      let existingUsername = await User.findOne({ where: { username: username } });
      if (existingUsername) {
        return next(new ErrorHandler(400, "This username already exists"));
      }
      await User.create({ username: username, password: hashedPassword, email: email });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    let oldOTP = await Otp.findOne({ where: { email: email.toLowerCase() } });

    if (oldOTP) {
      console.log("old otp");
      console.log(otp);
      await oldOTP.update({ otp: otp, otpCreatedAt : Date.now() });
    } else {
      console.log("new otp");
      console.log(otp);
      await Otp.create({ email: email, otp: otp, otpCreatedAt: Date.now() });
    }

    sendmail(email, otp, "Email Verification");

    res.status(201).json({
      success: true,
      message: "Sign up successful! Please verify your account using the OTP sent to your email"
    });
  } catch (err) {
    next(err);
  }
};

const emailVerification = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    console.log(otp);
    console.log(email);
    let OTP = await Otp.findOne({ where: { email: email } });
    console.log(OTP);
    if (otp !== OTP?.otp) {
      return next(new ErrorHandler(400, "Invalid OTP"));
    }
    if(Date.now() - OTP.otpCreatedAt >= 300000){
      return next(new ErrorHandler(400, "OTP expired"));
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    user.isVerified = true;
    await user.save();

    await Otp.destroy({ where: { email: email.toLowerCase() } });

    const shortId = user.shortId;
    const payload = {
      id: user._id,
      unique_identifier: shortId,
    };

    const accesstoken = createAccessToken(payload);
    const refreshtoken = createRefreshToken(payload);

    res.status(200).json({ success: true, message: "Email Verified", data: {
       "accesstoken" : accesstoken, 
       "refreshtoken" : refreshtoken
      }
    });
  } catch (err) {
    next(err);
  }
};

const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      return next(new ErrorHandler(400, "No user exists with this email"));
    }

    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch) {
      return next(new ErrorHandler(400, "Invalid Credentials!"));
    }

    if (!user.isVerified) {
      return next(new ErrorHandler(400, "Email is not verified"));
    }

    const shortId = shortid.generate();
    await user.update(
      { shortId: shortId },
      {
         where: { email: email.toLowerCase() }
      }
    );
    const payload = {
      id: user._id,
      unique_identifier: shortId,
    };

    const accesstoken = createAccessToken(payload);
    const refreshtoken = createRefreshToken(payload);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        "accesstoken" : accesstoken,
        "refreshtoken" : refreshtoken,
        username: user.username,
        email,
        isVerified: user.isVerified
      },
    });
  } catch (err) {
    next(err);
  }
};

const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      return next(new ErrorHandler(400, "No user exists with this email"));
    }

    if (!user.isVerified) {
      return next(new ErrorHandler(400, "Email is not verified"));
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    let existingOtp = await Otp.findOne({ where: { email: email.toLowerCase() } });

    if (existingOtp) {
      await existingOtp.update({ otp: otp, otpCreatedAt : Date.now() });
    } else {
      await Otp.create({ email: email, otp: otp, otpCreatedAt : Date.now() });
    }

    sendmail(email, otp);
    res.json({ success: true, message: "Otp is sent to your registered email" });
  } catch (err) {
    next(err);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      return next(new ErrorHandler(400, "No user exists with this email"));
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const existingOtp = await Otp.findOne({ where: { email: email.toLowerCase() } });

    if (existingOtp) {
      if (Date.now() - existingOtp.otpCreatedAt >= 60000) {
        await existingOtp.update({ otp: otp, otpCreatedAt: Date.now() });
      } else {
        return next(new ErrorHandler(400, "60 seconds not completed"));
      }
    } else {
      await Otp.create({ email: email, otp: otp, createdAt: Date.now() });
    }

    sendmail(email, otp, "Reset Password");

    res.json({
      success: true,
      message: "New OTP has been sent to your registered email",
    });
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    let OTP = await Otp.findOne({ where: { email: email.toLowerCase() } });

    if (otp !== OTP?.otp) {
      return next(new ErrorHandler(400, "Invalid otp"));
    }
    if(Date.now() - OTP.otpCreatedAt >= 300000){
      return next(new ErrorHandler(400, "OTP expired"));
    }

    await Otp.destroy({ where: { email: email.toLowerCase() } });

    await User.update(
      { isVerified: true },
      {
        where: {
          email: email.toLowerCase(),
        },
      }
    );

    let user = await User.findOne({ where: { email: email.toLowerCase() } });

    const token = jwt.sign({ id: user._id }, process.env.RESET_KEY, {
      expiresIn: 300,
    });

    res.json({ success: true, message: "otp is validated", data: { token } });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const input = await newSchema.validateAsync(req.body);
    const email = input.email;
    const newPassword = input.newPassword;

    let user = await User.findOne({ where: { email: email.toLowerCase() } });
    const isMatch = await bcryptjs.compare(newPassword, user.password);

    if (isMatch) {
      return next(new ErrorHandler(400, "Please Change The Password!"));
    }

    let token = req.header("verify-token");
    const verified = jwt.verify(token, process.env.RESET_KEY);

    if (!verified) {
      return next(new ErrorHandler(400, "Please verify otp first"));
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 6);
    const shortId = shortid.generate();

    await User.update(
      { shortId: shortId, password: hashedPassword },
      {
        where: {
          id: verified.id,
        },
      }
    );

    res.json({ success: true, message: "password changed", data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
    signUp,
    emailVerification,
    signIn,
    forgetPassword,
    verifyOtp,
    resendOtp,
    changePassword,
    refreshAccessToken
}