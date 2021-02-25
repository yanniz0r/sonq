import { makeObservable, observable } from "mobx";
import { v4 } from "uuid";

class Player {
  
  public id = v4();
  
  @observable
  public points = 0;

  constructor(public username: string){
    makeObservable(this);
  }
}

export default Player;
