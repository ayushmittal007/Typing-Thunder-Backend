const { Server } = require("socket.io");
const { Redis } = require("ioredis");
const jwt = require("jsonwebtoken");
const { User, Room } = require("../models");

const client = new Redis();

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
        if (!verified || !verified.id) {
          console.log("Invalid Token");
          socket.emit("custom-error", "Invalid Token");
          return;
        }

        const user = await User.findOne({ where: { _id: verified.id } });
        if (!user) {
          socket.emit("custom-error", "No user exists with this token");
          return;
        }

        const userId = user._id;

        const room = await Room.create({
          leaderId: userId,
          numberOfPeople: 1,
        });

        await client.set(room.roomCode, JSON.stringify(room));

        socket.join(room.roomCode);
        socket.emit("room-created", room.roomCode);
      } catch (error) {
        console.error("Error creating room:", error);
        socket.emit("custom-error", "Error creating room");
      }
    });

    socket.on("join-room", async (roomCode, token) => {
      try {
        const verified = jwt.verify(token, process.env.JWT_ACCESS_KEY);
        if (!verified) {
          socket.emit("custom-error", "Invalid Token");
          return;
        }

        const user = await User.findOne({ where: { _id: verified.id } });
        if (!user) {
          socket.emit("custom-error", "No user exists with this token");
          return;
        }

        if (!roomCode) {
          socket.emit("custom-error", "Room Code is required");
          return;
        }

        let room = JSON.parse(await client.get(roomCode));

        if (!room) {
          room = await Room.findOne({ where: { roomCode } });

          if (room) {
            await client.set(room.roomCode, JSON.stringify(room));
          }
        }

        let numberOfPeople = room.numberOfPeople;

        if (numberOfPeople == 4) {
          socket.emit("custom-error", "Room is full");
          return;
        }

        numberOfPeople = room.numberOfPeople + 1;
        await Room.update({ numberOfPeople }, { where: { roomCode } });

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
          socket.emit("custom-error", "Invalid Token");
          return;
        }
        const user = await User.findOne({ where: { _id: verified.id } });
        if (!user) {
          socket.emit("custom-error", "No user exists with this token");
          return;
        }
        const userId = user._id;

        let room = JSON.parse(await client.get(roomCode));

        if (!room) {
          room = await Room.findOne({ where: { roomCode } });

          if (room) {
            await client.set(room.roomCode, JSON.stringify(room));
          }
        }

        const numberOfReadyPeople = room.numberOfReadyPeople + 1;
        await Room.update({ numberOfReadyPeople }, { where: { roomCode } });
        if (numberOfReadyPeople == room.numberOfPeople) {
          socket.to(roomCode).emit("start-game");
        }
      } catch (error) {
        console.error("Error readying up:", error);
      }
    });

    socket.on("start-game", async (roomCode) => {
      try {
        
        let room = JSON.parse(await client.get(roomCode));

        if (!room) {
          room = await Room.findOne({ where: { roomCode } });

          if (room) {
            await client.set(room.roomCode, JSON.stringify(room));
          }
        }

        const numberOfPeople = room.numberOfPeople;
        if (numberOfPeople < 2) {
          socket.emit("custom-error", "Not enough players");
          return;
        }

        socket.to(roomCode).emit("success-start-game");
      } catch (error) {
        console.error("Error starting game:", error);
      }
    });

    socket.on("get-position", async (roomCode, token , position) => {
      try {
        const verified = jwt.verify(token, process.env.JWT_ACCESS_KEY);
        if (!verified) {
          socket.emit("custom-error", "Invalid Token");
          return;
        }
        const user = await User.findOne({ where: { _id: verified.id } });
        if (!user) {
          socket.emit("custom-error", "No user exists with this token");
          return;
        }
        const userId = user._id;

        let room = JSON.parse(await client.get(roomCode));

        if (!room) {
          room = await Room.findOne({ where: { roomCode } });

          if (room) {
            await client.set(room.roomCode, JSON.stringify(room));
          }
        }

        const userPosition = position;

        socket.to(roomCode).emit("user-position", user.username ,userPosition);

      } catch (error) {
        console.error("Error getting position:", error);
      }
    });
  });
};

module.exports = { initializeSocket };