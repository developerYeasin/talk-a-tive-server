const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
// const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const chat = require("./routes/chatRoutes");
const users = require("./routes/userRoutes");
const messageRoute = require("./routes/messageRoutes.js");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
require("dotenv").config();

app.use(cors());
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.amzsa.mongodb.net/${process.env.DB_NAME}`;
mongoose
  .connect(url)
  .then(() => console.log("connection successful"))
  .catch((err) => console.log(err));

app.use("/users", users);
app.use("/chat", chat);
app.use("/message", messageRoute);



app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

const server = app.listen(port);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://mern-talk-a-tive.web.app",
  },
});

io.on("connection", (socket) => {
  // console.log("connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    // console.log("user joined room" + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"))
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    
    if (!chat.users) return console.log("chat.users not defined");
    
    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });


});
