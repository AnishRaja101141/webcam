// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public")); // Serve static files from 'public' folder

// Store user sessions (mapping user links to admin)
let userSessions = {};

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  // Admin generates a link for the user
  socket.on("generate-link", (userId) => {
    const link = `http://localhost:3000/user/${userId}`;
    userSessions[userId] = { socketId: socket.id, link };
    io.to(socket.id).emit("generated-link", link);
  });

  // Admin starts a session with the user (admin only sees user's webcam)
  socket.on("start-session", (userId) => {
    if (userSessions[userId]) {
      const userSocketId = userSessions[userId].socketId;
      io.to(userSocketId).emit("start-webcam");
      io.to(socket.id).emit("admin-session-started");
    }
  });

  // Forward WebRTC offer, answer, and ICE candidates between admin and user
  socket.on("offer", (offer, userId) => {
    const userSocketId = userSessions[userId]?.socketId;
    if (userSocketId) {
      io.to(userSocketId).emit("offer", offer);
    }
  });

  socket.on("answer", (answer, userId) => {
    const userSocketId = userSessions[userId]?.socketId;
    if (userSocketId) {
      io.to(userSocketId).emit("answer", answer);
    }
  });

  socket.on("ice-candidate", (candidate, userId) => {
    const userSocketId = userSessions[userId]?.socketId;
    if (userSocketId) {
      io.to(userSocketId).emit("ice-candidate", candidate);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected: " + socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
