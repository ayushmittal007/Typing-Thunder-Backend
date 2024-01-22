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
const { 
    signUpSchema ,
    emailVerificationSchema ,
    signInWithEmailSchema ,
    signInWithUsernameSchema ,
    forgetPasswordSchema,
    newPasswordSchema,
   } = require("../utils/joi_validations");
   
const { getGoogleOauthToken, getGoogleUser } = require("../config/oauth_config");

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
    if (!refreshtoken){
      return next(new ErrorHandler(400, "Please Login or Register"));
    }
    
    const payload = jwt.verify(refreshtoken, process.env.JWT_REFRESH_KEY);

    if(!payload) {
      return next(new ErrorHandler(400, "Invalid Refresh Token"));
    }
    
    const accesstoken = createAccessToken(payload);
    return res.status(200).json({ suucces : true ,  data : { accesstoken } });

  } catch (err) {
    next(err);
  }
};

const signUp = async (req, res, next) => {
  try {
    const input = await signUpSchema.validateAsync(req.body);
    const username = input.username;
    const email = input.email;
    const password = input.password;

    const hashedPassword = await bcryptjs.hash(password, 6);

    const existingEmail = await User.findOne({ where: { email: email.toLowerCase() } });

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
      const existingUsername = await User.findOne({ where: { username: username } });
      if (existingUsername && existingUsername.isVerified) {
        return next(new ErrorHandler(400, "This username already exists"));
      }
      await User.create({ username: username, password: hashedPassword, email: email });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    const oldOTP = await Otp.findOne({ where: { email: email.toLowerCase() } });

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
    const input = await emailVerificationSchema.validateAsync(req.body);
    const { email, otp } = req.body;
    console.log(otp);
    console.log(email);
    const OTP = await Otp.findOne({ where: { email: email } });
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

const signInWithEmail = async (req, res, next) => {
  try {
    const input = await signInWithEmailSchema.validateAsync(req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      return next(new ErrorHandler(400, "No user exists with this email"));
    }

    if (!user.isVerified) {
      return next(new ErrorHandler(400, "No user exists with this email"));
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return next(new ErrorHandler(400, "Invalid Credentials!"));
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
        email
      },
    });
  } catch (err) {
    next(err);
  }
};

const signInWithUsername = async (req, res, next) => {
  try {
    const input = await signInWithUsernameSchema.validateAsync(req.body);
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username: username } });
    if (!user) {
      return next(new ErrorHandler(400, "No user exists with this username"));
    }

    if (!user.isVerified) {
      return next(new ErrorHandler(400, "No user exists with this username"));
    }
    
    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch) {
      return next(new ErrorHandler(400, "Invalid Credentials!"));
    }

    const shortId = shortid.generate();
    await user.update(
      { shortId: shortId },
      {
         where: { username : username }
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
        username: user.username
      },
    });
  } catch (err) {
    next(err);
  }
}

const forgetPassword = async (req, res, next) => {
  try {
    const input = await forgetPasswordSchema.validateAsync(req.body);
    const { email } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      return next(new ErrorHandler(400, "No user exists with this email"));
    }

    if (!user.isVerified) {
      return next(new ErrorHandler(400, "No user exists with this email"));
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const existingOtp = await Otp.findOne({ where: { email: email.toLowerCase() } });

    if (existingOtp) {
      await existingOtp.update({ otp: otp, otpCreatedAt : Date.now() });
    } else {
      await Otp.create({ email: email, otp: otp, otpCreatedAt : Date.now() });
    }

    sendmail(email, otp, "Email Verification");
    res.json({ success: true, message: "Otp is sent to your registered email" });
  } catch (err) {
    next(err);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const input = await forgetPasswordSchema.validateAsync(req.body);
    const { email } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

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

    sendmail(email, otp, "Email Verification");

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
    const input = await emailVerificationSchema.validateAsync(req.body);
    const { email, otp } = req.body;
    const OTP = await Otp.findOne({ where: { email: email.toLowerCase() } });

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

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    const token = jwt.sign({ id: user._id }, process.env.RESET_KEY, {
      expiresIn: 300,
    });

    res.json({ success: true, message: "otp is validated", data: { token } });
  } catch (err) {
    next(err);
  }
};

const continueWithoutChangingPassword = async (req, res, next) => {
  try {
    const input = await forgetPasswordSchema.validateAsync(req.body);
    const email = input.email;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if(!user){
      return next(new ErrorHandler(400, "No user exists with this email"));
    }

    const token = req.header("verify-token");
    const verified = jwt.verify(token, process.env.RESET_KEY);
    if (!verified) {
      return next(new ErrorHandler(400, "Please verify otp first"));
    }

    const shortId = user.shortId;
    const payload = {
      id: user._id,
      unique_identifier: shortId,
    };
    const accesstoken = createAccessToken(payload);
    const refreshtoken = createRefreshToken(payload);
    res.json({ success: true, message: "Login Successfull", data: { accesstoken, refreshtoken } });
  }catch(err){
    next(err);
  }
}

const changePassword = async (req, res, next) => {
  try {
    const input = await newPasswordSchema.validateAsync(req.body);
    const email = input.email;
    const newPassword = input.newPassword;

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    const isMatch = await bcryptjs.compare(newPassword, user.password);

    if (isMatch) {
      return next(new ErrorHandler(400, "Please Change The Password!"));
    }

    const token = req.header("verify-token");
    const verified = jwt.verify(token, process.env.RESET_KEY);

    if (!verified) {
      return next(new ErrorHandler(400, "Please verify otp first"));
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 6);
    const shortId = shortid.generate();
    console.log(verified.id);
    await User.update(
      { shortId: shortId, password: hashedPassword },
      {
        where: {
          _id: verified.id,
        },
      }
    );
    const payload = {
      id: verified.id,
      unique_identifier: shortId,
    }
    const accesstoken = createAccessToken(payload);
    const refreshtoken = createRefreshToken(payload);

    res.json({ success: true, message: "password changed", data: {accesstoken , refreshtoken}});
  } catch (err) {
    next(err);
  }
};

const isValidAceessToken = async (req, res, next) => {
  try {
    const token = req.header("auth-token");
    if (!token) {
      return next(new ErrorHandler(400, "Please Login or Register"));
    }
    const verified = jwt.verify(token, process.env.JWT_ACCESS_KEY);
    if (!verified) {
      return next(new ErrorHandler(400, "Invalid Token"));
    }
    const user = await User.findOne({ where: { _id: verified.id } });
    if (!user) {
      return next(new ErrorHandler(400, "No user exists with this token"));
    }
    const unique_identifier = verified.unique_identifier;
    if (user.shortId !== unique_identifier) {
      return next(new ErrorHandler(400, "Invalid Token"));
    }
    res.json({ success: true, message: "Valid Token"});
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req , res , next) => {
  const { CLIENT_ID, REDIRECT_URI } = process.env;
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=email%20profile`;
  res.redirect(authUrl);
} 

const googleOauthHandler = async (req, res, next) => {
  try {
    console.log('Google OAuth Handler');
    console.log(req.query.code);
    const code = req.query.code;

    if (!code) {
      return next(new ErrorHandler(500, 'Authentication Failed'));
    }

    const { id_token, access_token } = await getGoogleOauthToken({ code });

    const { name, verified_email, email, picture } = await getGoogleUser({
      id_token,
      access_token,
    });

    if (!verified_email) {
      return next(new ErrorHandler(500, 'Google account not verified'));
    }

    let payload;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      console.log('Creating new user');
      const shortId = shortid.generate();
      const newUser = new User({
        email,
        username : name + shortId,
        password : shortId,
        shortId: shortId,
        isVerified: true,
      });
      await newUser.save();
      payload = {
        id: newUser._id,
        unique_identifier: newUser.shortId,
      };
    } else {
      console.log('User already exists');
      user.email = email;
      user.isVerified = true;
      await user.save();
      payload = {
        id: user._id,
        unique_identifier: user.shortId,
      };
    }
    
    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);
    res.status(200).json({ success: true, data: { accessToken, refreshToken } });
  } catch (err) {
    console.log('Failed to authorize Google User', err);
    return next(new ErrorHandler(500, 'Internal Server Error'));
  }
};

module.exports = {
    signUp,
    emailVerification,
    signInWithEmail,
    signInWithUsername,
    forgetPassword,
    verifyOtp,
    resendOtp,
    continueWithoutChangingPassword,
    changePassword,
    refreshAccessToken,
    isValidAceessToken,
    googleLogin,
    googleOauthHandler
}