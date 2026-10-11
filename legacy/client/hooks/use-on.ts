import { useEffect } from "react";
import { Socket } from "socket.io-client";

const useOn = <P>(
  io: Socket,
  event: string,
  handler: (payload: P) => void
) => {
  useEffect(() => {
    io.on(event, handler);
    return () => {
      io.off(event, handler);
    };
  }, [io, event, handler]);
};

export default useOn;
