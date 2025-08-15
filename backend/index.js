import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import socketHandler from "./socket.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", //we can use it on any server
  },
});

socketHandler(io);

const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, "/frontend/dist")));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

server.listen(PORT, () => {
  console.log("Server is working on port 5000");
});
