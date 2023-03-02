import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { lastValueFrom, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http:HttpClient) { }
  /**
   *  ‘atmId’ : dataNumber,
   *  ‘securityCode’ : dataNumber
   * @param code 
   * @returns 
   */
  public async sendQR(code:any){
    try{
      //return {amount:500}; //mock test
      return await lastValueFrom(this.http.post(environment.endpoint,{
        atmId:environment.atmID,
        securityCode:code
      }).pipe(timeout(30000)));
    }catch(err){
      return {error:true,msg:err};
    }
  }
}
