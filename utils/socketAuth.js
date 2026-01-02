import jwt from "jsonwebtoken";

export default function authenticate(socket) {
  if (socket.user) return socket.user; // already verified

  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers.authorization?.split(" ")[1];

  if (!token) throw new Error("No token");

  const user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  socket.user = user;
  return user;
}
