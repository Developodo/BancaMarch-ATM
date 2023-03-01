import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { lastValueFrom, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http:HttpClient) { }

  public async sendQR(code:any){
    try{
      return await lastValueFrom(this.http.post(environment.endpoint,{
        atm:environment.atmID,
        code:code
      }).pipe(timeout(30000)));
    }catch(err){
      return {error:true,msg:err};
    }
  }
}
