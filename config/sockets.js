const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { User, Room } = require("../models");
const { ErrorHandler } = require("../middlewares/errorHandling");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
    },
    connectionStateRecovery: {},
  });

  io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("disconnect", () => {
      console.log("disconnected");
    });

    socket.on("create-room", async (token) => {
      try {
        const verified = jwt.verify(token, process.env.JWT_ACCESS_KEY);
        if (!verified) {
          return next(new ErrorHandler(400, "Invalid Token"));
        }
        const user = await User.findOne({ where: { _id: verified.id } });
        if (!user) {
          return next(new ErrorHandler(400, "No user exists with this token"));
        }
        const userId = user._id;

        const room = await Room.create({
          leaderId: userId,
          numberOfPeople: 1,
        });

        socket.join(room.roomCode);
        socket.emit("room-created", room.roomCode);
      } catch (error) {
        console.error("Error creating room:", error);
      }
    });

    socket.on("join-room", async (roomCode, token) => {
      try {
        if (!roomCode) {
          return next(new ErrorHandler(400, "Room Code is required"));
        }

        const room = await Room.findOne({ where: { roomCode } });
        if (!room) {
          return next(new ErrorHandler(400, "No room exists with this code"));
        }

        const numberOfPeople = room.numberOfPeople + 1;
        await Room.update({ numberOfPeople }, { where: { roomCode } });

        if (numberOfPeople > 4) {
          return next(new ErrorHandler(400, "Room is full"));
        }

        const verified = jwt.verify(token, process.env.JWT_ACCESS_KEY);
        if (!verified) {
          return next(new ErrorHandler(400, "Invalid Token"));
        }

        const user = await User.findOne({ where: { _id: verified.id } });
        if (!user) {
          return next(new ErrorHandler(400, "No user exists with this token"));
        }

        const userId = user._id;
        console.log("join-room", roomCode, userId);

        socket.join(roomCode);
        socket.to(roomCode).emit("user-connected", userId);

        socket.on("disconnect", () => {
          socket.to(roomCode).emit("user-disconnected", userId);
        });
      } catch (error) {
        console.error("Error joining room:", error);
      }
    });

    socket.on("ready", async (roomCode, token) => {
        try {
            const verified = jwt.verify(token, process.env.JWT_ACCESS_KEY);
            if (!verified) {
            return next(new ErrorHandler(400, "Invalid Token"));
            }
            const user = await User.findOne({ where: { _id: verified.id } });
            if (!user) {
            return next(new ErrorHandler(400, "No user exists with this token"));
            }
            const userId = user._id;
            
            const room = await Room.findOne({ where: { roomCode } });
            if (!room) {
            return next(new ErrorHandler(400, "No room exists with this code"));
            }

            const numberOfReadyPeople = room.numberOfReadyPeople + 1;
            await Room.update({ numberOfReadyPeople }, { where: { roomCode } });
            if(numberOfReadyPeople == room.numberOfPeople) {
                socket.to(roomCode).emit("start-game");
            }
        } catch (error) {
            console.error("Error readying up:", error);
        }
    });

    socket.on("start-game", async (roomCode) => {
        try {
            const room = await Room.findOne({ where: { roomCode } });
            if (!room) {
            return next(new ErrorHandler(400, "No room exists with this code"));
            }
    
            const numberOfPeople = room.numberOfPeople;
            if (numberOfPeople < 2) {
            return next(new ErrorHandler(400, "Not enough players"));
            }
    
            socket.to(roomCode).emit("success-start-game");
        } catch (error) {
            console.error("Error starting game:", error);
        }
    });
  });
};

module.exports = { initializeSocket };