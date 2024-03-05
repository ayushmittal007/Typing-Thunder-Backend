const { Server, Socket } = require("socket.io");
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
      let token = socket.handshake.auth.token;
      token = token.trim();
      console.log("Token:", token);
      socket.authToken = token;
      try {
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
        
      } catch (e) {
        console.log("Error:", "token is invalid");
        socket.emit("custom-error", "Invalid Token");
      }

    }catch (err){
      console.log("Error:", err);
      socket.emit("custom-error", "Error connecting to the server");
    }
    
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

        socket.to(roomCode).emit("user-connected", user.username);

        const newUser = await User.update({ roomId: room._id }, { where: { _id: user._id } });
        numberOfPeople = room.numberOfPeople + 1;
        
        await Room.update({ numberOfPeople }, { where: { roomCode } });

        const userId = user._id;
        console.log("join-room", roomCode, userId);

        const leader = await User.findOne({ where: { _id: room.leaderId } });
        if(!leader){
          socket.emit("custom-error", "Leader does not exist");
          return;
        }

        const users = await User.findAll({ where: { roomId: room._id } });
        const usernames = users.map((user) => ({
          username : user.username,
          role : user._id == leader._id ? "Leader" : "Member"
        }));
        console.log("Users:", usernames);
        
        socket.to(roomCode).emit("users-list", usernames);

      } catch (error) {
        console.error("Error joining room:", error);
      }
    });

    // socket.on("update-users-list" , async (roomCode) => {
    //   try {
    //     const token = socket.authToken;
    //     const verified = jwt.verify(token, process.env.JWT_ACCESS_KEY);
    //     if (!verified) {
    //       socket.emit("custom-error", "Invalid Token");
    //       return;
    //     }
    //     const user = await User.findOne({ where: { _id: verified.id } });
    //     if (!user) {
    //       socket.emit("custom-error", "No user exists with this token");
    //       return;
    //     }
    //     const userId = user._id;

    //     const room = await Room.findOne({ where: { roomCode } });
    //     if(!room){
    //       socket.emit("custom-error", "Room does not exist");
    //       return;
    //     }

    //     const leader = await User.findOne({ where: { _id: room.leaderId } });
    //     if(!leader){
    //       socket.emit("custom-error", "Leader does not exist");
    //       return;
    //     }

    //     const users = await User.findAll({ where: { roomId: room._id } });
    //     const usernames = users.map((user) => ({
    //       username : user.username,
    //       role : user._id == leader._id ? "Leader" : "Member"
    //     }));
        
    //     io.to(roomCode).emit("users-list", usernames);

    //   } catch (error) {
    //     console.error("Error updating users list:", error);
    //   }
    // });

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
        user.isReady = true;
        user.position = 0;
        await user.save();
        
        socket.to(roomCode).emit("user-ready", user.username , "is ready"); 
        
      } catch (error) {
        console.error("Error readying up:", error);
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

        user.isReady = true;
        user.position = 0;
        await user.save();

        const users = await User.findAll({ where: { roomId: room._id } });
        for(let i = 0 ; i < users.length ; i++){
          if(!users[i].isReady){
            socket.emit("custom-error", "All users are not ready");
            return;
          }
        }

        socket.to(roomCode).emit("starting-game" , "Game is starting....");
      } catch (error) {
        console.error("Error starting game:", error);
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

    socket.on("end-game", async (roomCode , wpm , accuracy) => {
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
        user.isReady = false;
        user.position = null;
        await user.save();

        const room = await Room.findOne({ where: { roomCode } });
        if(!room){
          socket.emit("custom-error", "Room does not exist");
          return;
        }
        socket.to(roomCode).emit("result:-" , "username:", user.username , "wpm:", wpm , "accuracy:", accuracy);
      } catch (error) {
        console.error("Error ending game:", error);
      }
    });

    socket.on("disconnect", async () => {
      try{
        const token = socket.authToken;
        const verified = jwt.verify(token, process.env.JWT_ACCESS_KEY);
        if (!verified) {
          socket.emit("custom-error", "Invalid Token");
          return;
        }
        const user = await User.findOne({ where: { _id: verified.id } });
        user.roomId = null;
        user.isReady = false;
        user.position = null;
        await user.save();
        console.log("user-disconnected" , user.username);
        socket.emit('user-disconnected' , user.username);
      }catch(err){
        console.log("Error:", err);
      }
      // const room = await Room.findOne({ where: { leaderId: user._id } });
      // if(room){
      //   user.isReady = false;
      //   user.position = null;
      //   await user.save();
      //   const users = await User.findAll({ where: { roomId: room._id } });
      //   let newLeader;
      //   for(let i = 0 ; i < users.length ; i++){
      //     if(users[i]._id != user._id){
      //       newLeader = users[i];
      //       break;
      //     }
      //   }

      //   if(!newLeader){
      //     await Room.destroy({ where: { _id: room._id } });
      //     socket.to(room.roomCode).emit("ending-game" , "Leader Disconnected and Game Ended...");
      //     return;
      //   }
      //   console.log("New Leader:", newLeader.username);
      //   await Room.update({ leaderId: newLeader._id } , { where: { _id: room._id } });
      //   socket.to(room.roomCode).emit("new-leader" , newLeader.username);
      //   return;
      // }

      // const roomId = user.roomId;
      // const room1 = await Room.findOne({ where: { _id: roomId } });
      // if(room1){
      //   let numberOfPeople = room1.numberOfPeople - 1;
      //   user.isReady = false;
      //   user.position = null;
      //   await user.save();
      //   await Room.update({ numberOfPeople }, { where: { _id: roomId } });
      //   socket.to(room1.roomCode).emit("user-disconnected", user.username);
      // }
    });

    socket.on("end-room" , async (roomCode) => {
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
        user.isReady = false;
        user.position = null;
        await user.save();
        await Room.destroy({ where: { leaderId: userId } });
        socket.to(room.roomCode).emit("ending-game" , "Leader Ended the Game...");
      } catch (error) {
        console.error("Error ending room:", error);
      }
    });

    socket.on("chat-message", async (roomCode, message) => {
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

        io.to(roomCode).emit("sent-message", user.username, message);
      } catch (error) {
        console.error("Error sending chat message:", error);
      }
    });
  });
};

module.exports = { initializeSocket };