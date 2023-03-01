import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import jsQR from 'jsqr';
import { StateManagmentService } from './services/state-managment.service';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnInit {
  time: string = new Date().toLocaleTimeString();
  
  @ViewChild('video', { static: false }) video?: ElementRef;
  @ViewChild('canvas', { static: false }) canvas?: ElementRef;
  videoElement: any;
  canvasElement: any;
  canvasContext: any;
  stream: any;

  /** Scanning Status */
  timeoutScanning:any=null;
  /** Error Status */
  error:any ="";
  /** countDown */
  countdown:number = 0;

  constructor(public stateS: StateManagmentService, private api:ApiService) {
    setInterval(() => {
      const date = new Date();
      this.time = date.toLocaleTimeString();
      --this.countdown<0?this.countdown=0:'';
    }, 1000);
  }

  ngOnInit(): void {
    this.stateS.state.subscribe((state) => {
      switch (state.status) {
        case 0:
          if(this.timeoutScanning) clearTimeout(this.timeoutScanning);
          this.countdown=0;
          console.log('REPOSO');
          break;
        case 1:
          console.log('LEYENDO QR');
          if(this.timeoutScanning) clearTimeout(this.timeoutScanning);
          this.countdown=30;
          this.timeoutScanning = setTimeout(()=>{
            this.cancelOnErrorTimeout('No se ha podido escanear ningún código QR. Inténtelo de nuevo.');
          },30000)
          break;
        case 2:
          console.log('ERROR LECTURA QR');
          if(this.timeoutScanning) clearTimeout(this.timeoutScanning);
          this.countdown=15;
          this.timeoutScanning = setTimeout(()=>{
            this.home();
          },15000)
          this.error = state.error;
          break;
        case 3:
          console.log('LECTURA QR -> ENVIANDO AL SERVICIO');
          if(this.timeoutScanning) clearTimeout(this.timeoutScanning);
          this.countdown=30;
          this.timeoutScanning = setTimeout(()=>{
            this.cancelOnErrorTimeout('No se ha podido comprobar el estado de su operación. Inténtelo de nuevo y en caso de error, solicite un nuevo QR.');
          },30000)
          break;
        case 4:
          console.log('OPERACION SATISFACTORIA');
          if(this.timeoutScanning) clearTimeout(this.timeoutScanning);
          this.countdown=15;
          this.timeoutScanning = setTimeout(()=>{
           this.home();
          },15000)
          break;
        default:
          if(this.timeoutScanning) clearTimeout(this.timeoutScanning);
          this.countdown=0;
          this.home();
          console.log('ESTADO DESCONOCIDO');
      }
    });
  }

  startScanning() {
    this.stateS.changeState({ status: 1 });
    this.videoElement = this.video?.nativeElement;
    this.canvasElement = this.canvas?.nativeElement;
    this.canvasContext = this.canvasElement.getContext('2d', {
      willReadFrequently: true,
    });
    const constraints = {
      video: {
        facingMode: 'environment',
      },
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(async (stream) => {
        this.stream = stream;
        this.videoElement.srcObject = stream;
        this.videoElement.setAttribute('playsinline', true);
        this.videoElement.play();
        
        await requestAnimationFrame(await this.tick.bind(this));
      })
      .catch((err) => {
        console.log(err);
      });
  }
  ngAfterViewInit(): void {}

  async tick() {
    if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
      this.canvasElement.hidden = false;
      this.canvasElement.height = this.videoElement.videoHeight;
      this.canvasElement.width = this.videoElement.videoWidth;
      
      this.canvasContext.drawImage(
        this.videoElement,
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );
      const imageData = this.canvasContext.getImageData(
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );
      this.scanningGrid(this.canvasContext,this.canvasElement.width,this.canvasElement.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code && code.data != '') {
        const beep = document.getElementById('beep') as HTMLAudioElement;
        beep.play();
        this.sendQR(code);
      } else {
        await requestAnimationFrame(this.tick.bind(this));
      }
    } else {
      await requestAnimationFrame(this.tick.bind(this));
    }
  }

  stopScanning(): void {
    this.stream?.getTracks().forEach((track: any) => {
      (track as any).stop();
    });
  }

  cancelScanning() {
    this.stopScanning();
    this.stateS.changeState({ status: 0 });
  }

  scanningGrid(context: any,w:any,h:any) {
    
    context.lineWidth = 1;
    context.strokeStyle = '#FFF';

    for (let x = 1; x < w; x += 100) {
      context.moveTo(x, 0);
      context.lineTo(x, h);
    }
    for (let y = 1; y < h; y += 100) {
      context.moveTo(0, y);
      context.lineTo(w, y);
    }
    context.stroke();
  }
  cancelOnErrorTimeout(str:any){
    this.stopScanning();
    this.stateS.changeState({status:2,error:str});
    this.timeoutScanning=null;
  }
  home(){
    this.stateS.changeState({status:0})
  }
  async sendQR(code:any){
    this.stateS.changeState({status:3})
    this.stopScanning();
    let res:any = await this.api.sendQR(code);
    if(res && res['error']){
      this.stateS.changeState({status:2,error:'La validación de su código no ha sido satisfactoria. Quizá deba renovar su código QR.'})
    }else{
      this.stateS.changeState({status:4,msg:"OK"})
    }
  }
}
