import Session from "../models/session";

interface SocketHandler<D = any> {
  event: string;
  handle(session: Session): (payload: D) => void | Promise<void>;
}

export default SocketHandler;
