import { useEffect } from "react";


const useOn = <P>(io: SocketIOClient.Socket, event: string, handler: (payload: P) => void) => {
  useEffect(() => {
    io.on(event, handler);
    return () => {
      io.off(event, handler);
    }
  }, [io, event, handler]);
}

export default useOn;
