import { v4 } from "uuid";

class Player {
  public id = v4();

  constructor(public username: string){}
}

export default Player;
