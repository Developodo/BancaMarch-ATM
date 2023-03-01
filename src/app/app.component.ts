import { Component, ViewChild,ElementRef, AfterViewInit,OnInit } from '@angular/core';
import jsQR from "jsqr";
import { StateManagmentService } from './services/state-managment.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit,OnInit{
 
  title = 'atm';
  @ViewChild('video', { static: false } ) video?: ElementRef;
  @ViewChild('canvas', { static: false }) canvas?: ElementRef ;
  videoElement: any;
  canvasElement: any;
  canvasContext: any;
  stream: any;
  loading = false;
  qrResult = '';

  constructor(private stateS:StateManagmentService){}

  ngOnInit(): void {
    this.stateS.state.subscribe((state)=>{
      switch(state.status){
        case 0: console.log("REPOSO"); break;
        case 1: console.log("LEYENDO QR"); break;
        case 2: console.log("ERROR LECTURA QR"); break;
        case 3: console.log("LECTURA QR -> ENVIANDO AL SERVICIO"); break;
        case 4: console.log("ERROR SERVICIO"); break;
        case 5: console.log("OPERACION SATISFACTORIA"); break;
        default: console.log("ESTADO DESCONOCIDO");
      }
    })
  }

  ngAfterViewInit(): void {
    this.videoElement = this.video?.nativeElement;
    this.canvasElement = this.canvas?.nativeElement;
    this.canvasContext = this.canvasElement.getContext('2d');
    const constraints = {
      video: {
        facingMode: 'environment'
      }
    };
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      this.stream = stream;
      this.videoElement.srcObject = stream;
      this.videoElement.setAttribute('playsinline', true);
      this.videoElement.play();
      requestAnimationFrame(this.tick.bind(this));
    }).catch((err) => {
      console.log(err);
    });
  }

  tick(): void {
    if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
      this.canvasElement.hidden = false;
      this.canvasElement.height = this.videoElement.videoHeight;
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasContext.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
      const imageData = this.canvasContext.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code) {
        this.qrResult = code.data;
        const beep = document.getElementById('beep') as HTMLAudioElement;
        beep.play();
        this.stopScanning();
      } else {
        requestAnimationFrame(this.tick.bind(this));
      }
    } else {
      requestAnimationFrame(this.tick.bind(this));
    }
  }

  stopScanning(): void {
    this.loading = false;
    this.stream.getTracks().forEach((track: any) => {
      (track as any).stop();
    });
  }
}
