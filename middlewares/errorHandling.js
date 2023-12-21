class ErrorHandler extends Error {
    constructor(statusCode,message){
        super(message);
        this.statusCode = statusCode;
    }
}

module.exports = {
    errorMiddleware : (err,req,res,next) => {
        console.log(err);
        err.message = err.message || "Interal Server Error";
        err.statusCode = err.statusCode || 500;

        return res.status(err.statusCode).json({
            success:false,
            message: err.message
        });
    },
    ErrorHandler
}