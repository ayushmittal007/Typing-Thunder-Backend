const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { User, Room } = require("../models");

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

  io.on("connection", async (socket) => {
    try{
      const token = socket.handshake.auth.token;
      socket.authToken = token;
      console.log("Token:", token);
      const verified = jwt.verify(token, process.env.JWT_ACCESS_KEY);
      if (!verified) {
        console.log("Invalid Token");
        socket.emit("custom-error", "Invalid Token");
        return;
      }

      const user = await User.findOne({ where: { _id: verified.id } });
      if (!user) {
        socket.emit("custom-error", "No user exists with this token");
        return;
      }

      console.log("a user connected" , user.email);
      socket.authToken = token;
    }catch (err){
      console.log("Error:", err);
      socket.emit("custom-error", "Error connecting to the server");
    }
    
    socket.on("disconnect", async () => {
      const token = socket.authToken;
      console.log("Token:", token);
      if (!token) {
          console.log("Token not provided");
          // Handle the case where the token is missing
          return;
      }
      const verified = jwt.verify(token, process.env.JWT_ACCESS_KEY);
      if (!verified) {
        console.log("Invalid Token");
        socket.emit("custom-error", "Invalid Token");
        return;
      }
      console.log(token);
      const user = await User.findOne({ where: { _id: verified.id } });

      let newUser = await User.update({ roomId: null }, { where: { _id: user._id } });
      newUser = await User.update({ isReady: false }, { where: { _id: user._id } });
      const room = await Room.findOne({ where: { leaderId: user._id } });
      if(room){
        await Room.destroy({ where: { leaderId: user._id } });
        socket.to(room.roomCode).emit("ending-game" , "Leader Ended the Game...");
      }

      const roomId = user.roomId;
      const room1 = await Room.findOne({ where: { _id: roomId } });
      if(room1){
        let numberOfPeople = room1.numberOfPeople - 1;
        await Room.update({ numberOfPeople }, { where: { _id: roomId } });
        socket.to(room1.roomCode).emit("user-disconnected", user.username);
      }
      
      console.log("user-disconnected" , user.username);
      socket.emit('user-disconnected' , user.username);
      console.log("disconnected");
    });

    socket.on("create-room", async () => {
      try {

        const token = socket.authToken;
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

        await User.update({ roomId: room._id }, { where: { _id: user._id } });

        // console.log("Room created:", socket.temp);
        socket.join(room.roomCode);
        socket.emit("room-created", room.roomCode);
      } catch (error) {
        console.error("Error creating room:", error);
        socket.emit("custom-error", "Error creating room");
      }
    });

    socket.on("join-room", async (roomCode) => {
      try {
        const token = socket.authToken;
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

        const room = await Room.findOne({ where: { roomCode } });
        if (!room) {
          socket.emit("custom-error", "Room does not exist");
          return;
        }

        console.log("User:", user.roomId, "Room:", room._id);

        if(user.roomId == room._id){
          console.log("User is already in the room");
          socket.emit("custom-error", "User is already in the room");
          return;
        }

        let numberOfPeople = room.numberOfPeople;
        console.log("Number of people:", numberOfPeople);

        if (numberOfPeople == 4) {
          socket.emit("custom-error", "Room is full");
          return;
        }

        const newUser = await User.update({ roomId: room._id }, { where: { _id: user._id } });
        numberOfPeople = room.numberOfPeople + 1;
        
        await Room.update({ numberOfPeople }, { where: { roomCode } });

        const userId = user._id;
        console.log("join-room", roomCode, userId);

        socket.join(roomCode);
        io.to(roomCode).emit("user-connected", user.username);
        
      } catch (error) {
        console.error("Error joining room:", error);
      }
    });

    socket.on("start-game", async (roomCode) => {
      try {
        const token = socket.authToken;
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

        const room = await Room.findOne({ where: { roomCode } });
        if(!room){
          socket.emit("custom-error", "Room does not exist");
          return;
        }

        if(room.leaderId != userId){
          socket.emit("custom-error", "User is not the leader");
          return;
        }
        let updatedUser = await User.update({ isReady: true }, { where: { roomId: room._id } });
        updatedUser = await User.update({ position: "0" }, { where: { roomId: room._id } });

        io.to(roomCode).emit("starting-game" , "Leader Wants to Start Game...");
      } catch (error) {
        console.error("Error starting game:", error);
      }
    });

    socket.on("ready", async (roomCode) => {
      try {
        const token = socket.authToken;
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

        const room = await Room.findOne({ where: { roomCode } });
        if(!room){
          socket.emit("custom-error", "Room does not exist");
          return;
        }

        const userReady = user.isReady;
        if(userReady){
          socket.emit("custom-error", "User is already ready");
          return;
        }

        let updatedUser = await User.update({ isReady: true }, { where: { _id: user._id } });
        updatedUser = await User.update({ position: "0" }, { where: { _id: user._id } });
        io.to(roomCode).emit("user-ready", user.username , "is ready"); 
        
      } catch (error) {
        console.error("Error readying up:", error);
      }
    });

    socket.on("update-position", async (roomCode , position) => {
      try {
        const token = socket.authToken;
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

        const room = await Room.findOne({ where: { roomCode } });
        if(!room){
          socket.emit("custom-error", "Room does not exist");
          return;
        }

        const userPosition = position;
        socket.to(roomCode).emit("user-position", user.username ,userPosition);
      } catch (error) {
        console.error("Error updating position:", error);
      }
    });

    socket.on("end-game", async (roomCode) => {
      try {
        const token = socket.authToken;
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

        const room = await Room.findOne({ where: { roomCode } });
        if(!room){
          socket.emit("custom-error", "Room does not exist");
          return;
        }

        if(room.leaderId != userId){
          socket.emit("custom-error", "User is not the leader");
          return;
        }

        socket.to(roomCode).emit("ending-game" , "Leader Wants to End Game...");
      } catch (error) {
        console.error("Error ending game:", error);
      }
    });
  });
};

module.exports = { initializeSocket };