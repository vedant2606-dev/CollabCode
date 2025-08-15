import axios from "axios";
import { stdin } from "process";

const rooms = new Map();

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("User connected !", socket.id);

    let currentRoom = null;
    let currentUser = null;

    socket.on("join", ({ roomId, userName, starterCode }) => {
      if (currentRoom) {
        socket.leave(currentRoom);
        rooms.get(currentRoom).users.delete(currentUser);
        io.to(currentRoom).emit(
          "userJoined",
          Array.from(rooms.get(currentRoom).users)
        );
      }

      currentRoom = roomId;
      currentUser = userName;

      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, { users: new Set(), code: starterCode || "" });
      }

      rooms.get(roomId).users.add(userName);

      socket.emit("codeUpdate", rooms.get(roomId).code);

      io.to(roomId).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom).users)
      );
    });

    socket.on("codeChange", ({ roomId, code }) => {
      if (rooms.has(roomId)) {
        rooms.get(roomId).code = code;
      }
      socket.to(roomId).emit("codeUpdate", code);
    });

    socket.on("leaveRoom", () => {
      if (currentRoom && currentUser) {
        rooms.get(currentRoom).users.delete(currentUser);
        io.to(currentRoom).emit(
          "userJoined",
          Array.from(rooms.get(currentRoom).users)
        );
        socket.leave(currentRoom);
        currentRoom = null;
        currentUser = null;
      }
    });

    socket.on("typing", ({ roomId, userName }) => {
      socket.to(roomId).emit("userTyping", userName);
    });

    socket.on("languageChange", ({ roomId, language }) => {
      io.to(roomId).emit("languageUpdate", language);
    });

    socket.on(
      "compileCode",
      async ({ code, roomId, language, version, input }) => {
        if (rooms.has(roomId)) {
          const room = rooms.get(roomId);
          const response = await axios.post(
            "https://emkc.org/api/v2/piston/execute",
            {
              language,
              version,
              files: [
                {
                  content: code,
                },
              ],
              stdin: input,
            }
          );

          room.output = response.data.run.output;
          io.to(roomId).emit("codeResponse", response.data);
        }
      }
    );

    socket.on("disconnect", () => {
      if (currentRoom && currentUser) {
        rooms.get(currentRoom).users.delete(currentUser);
        io.to(currentRoom).emit(
          "userJoined",
          Array.from(rooms.get(currentRoom).users)
        );
      }
      console.log("User disconnected !");
    });
  });
}
