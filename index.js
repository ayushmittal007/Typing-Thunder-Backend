const express = require("express");
const http = require("http");
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

const server = http.createServer(app);
const { Server } = require("socket.io");
// const io = new Server(server);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  },
  connectionStateRecovery: {},
});

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

const { User, Performance , Room } = require("./models");

User.hasMany(Performance, { as: 'performances' });
Performance.belongsTo(User);
Room.hasMany(User, { as: 'users' });
User.belongsTo(Room);

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("disconnected");
  });
  socket.on("create-room", async (roomName, userId) => {
    console.log("create-room", roomName, userId);
    const room = await Room.create({
      roomName: roomName,
    });
    const user = await User.findByPk(userId);
    // await user.setRoom(room);
    socket.join(room.roomCode);
    socket.emit("room-created", room.roomCode);
  });
  socket.on("join-room", async (roomCode, userId) => {
    console.log("join-room", roomCode, userId);
    socket.join(roomCode);
    socket.to(roomCode).emit("user-connected", userId);
    socket.on("disconnect", () => {
      socket.to(roomCode).emit("user-disconnected", userId);
    });
  });
});


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