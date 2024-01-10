const nodemailer = require('nodemailer');

const sendmail = async (email,otp,topic) => {
  try{
    const msg = {
        from: 'process.env.MAIL_ID',
        to: email,
        subject: topic,
        html: 
        ` <p style="margin-bottom: 30px;"> We are thrilled to have you on Typing Thunder ! To verify your identity , please use the following One-Time Password (OTP) code:
          </p>
          <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center; color:green;">${otp}</h1>
          <p style="font-size: 10px;>Please do not share this OTP with anyone.
          </p>
          <p style="font-size: 10px;>If you did not request this OTP, please ignore this email.Thank you for choosing our service.
          </p>
        <p>
          Thank you for choosing Typing Thunder.
        </p>`
      ,
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth:{
          user: process.env.MAIL_ID,
          pass: process.env.MAIL_PASS
      },
      port: 456,
      host: "smtp.gmail.com"
    });

    transporter.sendMail(msg,err=>{
        if(err){ 
          console.log(err);
          return false;
        } 
        else {
          return true;
        }
    });
  }catch(err){
    console.log(err);
  }
}

module.exports = { sendmail };