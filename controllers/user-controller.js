const { User , Performance } = require("../models");
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
        console.log(id);
        const user = await User.findOne({where : { _id : id }});
        if(!user){
            return next (new ErrorHandler(400 , "No user found"));
        }
        const data = await performanceSchema.validateAsync(req.body);
        const { wpm , accuracy , timing , raw , correct , incorrect , extra , missed } = data;

        const newPerformance = await Performance.create({
            wpm,
            accuracy,
            timing,
            raw,
            correct,
            incorrect,
            extra,
            missed,
            userId: id
        });

        res.status(201).json({
            success: true,
            message: "Performance saved successfully",
            performance: newPerformance,
        });   
    }catch(err){
        next(err)
    }
}

const getPerformances = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const user = await User.findOne({ where: { _id: userId } });
        if (!user) {
            return next(new ErrorHandler(404, "User not found"));
        }

        const performances = await user.getPerformances();
        if(!performances){
            return next(new ErrorHandler(404, "No performances found"));
        }

        res.status(200).json({
            success: true,
            performances,
        });
    } catch (err) {
        next(err);
    }
};


module.exports = {
    updateUsername,
    getUser,
    savePerformance,
    getPerformances
}