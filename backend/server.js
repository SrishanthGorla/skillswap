const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const Message = require("./models/Message");

dotenv.config();

const app = express();

// 🔥 Create HTTP server
const server = http.createServer(app);

// 🔥 Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 🔥 Connect DB
connectDB();

// 🔥 Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

// 🔥 Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// 🔥 Online Users Store
let onlineUsers = {};

// 🔥 Socket Logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join user
  socket.on("join", (username) => {
    onlineUsers[username] = socket.id;

    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  // Private message
  socket.on("sendPrivateMessage", async ({ text, sender, receiver }) => {
    try {
      const newMessage = new Message({
        text,
        user: sender
      });

      await newMessage.save();

      const receiverSocket = onlineUsers[receiver];

      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", {
          text,
          user: sender
        });
      }

      // Send back to sender
      socket.emit("receiveMessage", {
        text,
        user: sender
      });

    } catch (error) {
      console.log(error);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    for (let user in onlineUsers) {
      if (onlineUsers[user] === socket.id) {
        delete onlineUsers[user];
      }
    }

    io.emit("onlineUsers", Object.keys(onlineUsers));

    console.log("User disconnected:", socket.id);
  });
});

// 🔥 PORT
const PORT = process.env.PORT || 5000;

// 🔥 START SERVER (IMPORTANT CHANGE)
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});