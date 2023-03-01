import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StateManagmentService {
  private stateController:BehaviorSubject<any> = new BehaviorSubject({status:0});
  public stateController$ = this.stateController.asObservable();
  private _state ={}
  constructor() { }

  public changeState(data:any){
    this._state = {data,...this._state};
    this.stateController.next(this._state);
  }
  public get state(){
    return this.stateController$;
  }

}
