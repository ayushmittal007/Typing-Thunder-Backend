const { User } = require("../models");
const { ErrorHandler } = require("../middlewares/errorHandling");
const {  performanceSchema } = require("../utils/joi_validations");

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

const savePerformance = async (req, res, next) => {
    try{
        const id = req.user._id;
        const user = await User.findOne({where : { _id : id }});
        if(!user){
            return next (new ErrorHandler(400 , "No user found"));
        }
        const data = await performanceSchema.validateAsync(req.body);
        const { wpm , accuracy , timing , raw , correct , incorrect , extra , missed } = data;
        const performance = {
            wpm : wpm,
            accuracy : accuracy,
            timing : timing,
            raw : raw,
            correct : correct,
            incorrect : incorrect,
            extra : extra,
            missed : missed
        }
        console.log(performance);
        user.performances.push(performance);
        await user.save();
        console.log(user.performances);
        console.log(user);
        res.status(200).json({
            success : true,
            message : "Performance saved successfully",
            data : user.performances
        })
    }catch(err){
        next(err)
    }
}

const getPerformance = async (req, res, next) => {
    try{
        const id = req.user._id;
        const user = await User.findOne({where : { _id : id }});
        if(!user){
            return next (new ErrorHandler(400 , "No user found"));
        }
        console.log(user);
        console.log(user.username)
        console.log(user.performances);
        res.status(200).json({
            success : true,
            message : "Performance fetched successfully",
            data : user.performances
        })
    }catch(err){
        next(err)
    }
}

module.exports = {
    updateUsername,
    getUser,
    savePerformance,
    getPerformance
}