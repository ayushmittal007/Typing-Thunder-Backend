const { User } = require("../models");
const { ErrorHandler } = require("../middlewares/errorHandling");

const updateUsername = async (req, res, next) => {
    try{
        const { username } = req.body;
        const existingUsername = await User.findOne({where : { username : username }});
        if(existingUsername){
            return next(new ErrorHandler(400 , "This username already taken by someone else"));
        }
        
        const id = req.user._id;
        const user = await User.findOne({where : { _id : id }});
        if(user){
            user.username = username;
            await user.save();
            res.status(200).json({
                success : true,
                message : "Username updated successfully"
            })
        }else{
            return next (new ErrorHandler(400 , "No user found"));
        }
    }catch(err){
        next(err)
    }
}

const getUser = async (req, res, next) => {
    try{
        const id = req.user._id;
        console.log(User);
        const user = await User.findOne({where : { _id : id }});
        if(user){
            res.status(200).json({
                success : true,
                message : "User found",
                data : user
            })
        }else{
            return next (new ErrorHandler(400 , "No user found"));
        }
    }catch(err){
        next(err)
    }
}

// const analyzer = async (req, res, next) => {


module.exports = {
    updateUsername,
    getUser
}


// const express = require('express');
// const bodyParser = require('body-parser');
// const Sentiment = require('sentiment');

// const app = express();
// const port = 3000;

// // Middleware to parse JSON requests
// app.use(bodyParser.json());

// // Endpoint for sentiment analysis
// app.post('/analyze', (req, res) => {
//   const { text } = req.body;

//   if (!text) {
//     return res.status(400).json({ error: 'Text is required in the request body' });
//   }

//   const sentiment = new Sentiment();
//   const result = sentiment.analyze(text);

//   res.json({ sentiment: result });
// });

// // Start the server
// app.listen(port, () => {
//   console.log(Server is running on http://localhost:${port});
// });