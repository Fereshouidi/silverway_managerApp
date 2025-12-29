import { io } from "socket.io-client";

export const socketFromVercel = "https://wassim-project-back-end-three.vercel.app";
export const socketFromCodeIp = "http://192.168.1.104:3001"
export const socketFromLocalHost = "http://localhost:3001"

const socket = io(socketFromCodeIp, {
  autoConnect: true,
  // transports: ["websocket"]
});

export default socket;
