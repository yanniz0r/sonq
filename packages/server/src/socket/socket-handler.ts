import Session from "../models/session";

interface SocketHandler {
  event: string;
  handle(session: Session): (payload: unknown, ack?: () => void) => void | Promise<void>;
}

export default SocketHandler;
