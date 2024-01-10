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

module.exports = {
    updateUsername,
    getUser
}