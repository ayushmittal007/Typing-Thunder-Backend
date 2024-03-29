const jwt = require("jsonwebtoken")
const { User } = require("../models");
const { ErrorHandler } = require("../middlewares/errorHandling");

const auth = async (req, res, next) => {
    const token = req.header('auth-token')
    try {
        if (!token){
            return next(new ErrorHandler(400, "No authentication token, access denied."));
        }
        const verified = jwt.verify(token, process.env.JWT_ACCESS_KEY)
        if (!verified){
            return next(new ErrorHandler(400, "Token verification failed, access denied."));
        }
        const userId = parseInt(verified.payload.id , 10);
        const user = await User.findByPk(userId);
        if (!user){
            return next(new ErrorHandler(400, "No user found with this token."));
        }
        
        if(user.shortId !== verified.payload.unique_identifier){
            return next(new ErrorHandler(400, "Invalid token."));
        }

        req.user = user
        next()
    } catch (error) {
        next(error)
    }
}

module.exports = auth;