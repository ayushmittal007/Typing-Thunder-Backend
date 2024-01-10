const express = require("express");
const { errorMiddleware } = require("./middlewares/errorHandling");
require("dotenv").config();

const app = express();
const cors = require("cors");
app.use(
  cors({
    origin: "*",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(errorMiddleware);

const { sequelize } = require("./config/database");

const { authRouter , userRouter , GoogleAuthRouter } = require("./routes");

app.use("/api/auth", authRouter, errorMiddleware);
app.use("/api/user", userRouter, errorMiddleware);
app.use("/api/google", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, GoogleAuthRouter, errorMiddleware);

const PORT = process.env.PORT || 5000;
const connectDB = async () => {
  try {
      const result = await sequelize.sync();
      console.log('DB Connection has been established successfully.');
       
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Unable to connect to the database:", error);
  }
};

connectDB();