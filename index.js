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

const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRouter, errorMiddleware);
app.use("/api/user", userRouter, errorMiddleware);
app.use("/api/google", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, GoogleAuthRouter, errorMiddleware);

const bodyParser = require('body-parser');
const Sentiment = require('sentiment');

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Endpoint for sentiment analysis
app.post('/analyze', (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required in the request body' });
  }

  const sentiment = new Sentiment();
  const result = sentiment.analyze(text);

  res.json({ sentiment: result });
});

// Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

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