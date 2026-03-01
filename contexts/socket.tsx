// "use client";

// import React from "react";
// // import socket from "@/lib/socket";
// import { createContext, useContext, useEffect } from "react";

// const SocketContext = createContext<any>(null);

// export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
//   useEffect(() => {
//     socket.connect();

//     return () => {
//       socket.disconnect();
//     };
//   }, []);

//   return (
//     <SocketContext.Provider value={socket}>
//       {children}
//     </SocketContext.Provider>
//   );
// };

// export const useSocket = () => useContext(SocketContext);
