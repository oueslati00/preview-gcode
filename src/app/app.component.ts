import {AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewChildren} from '@angular/core';
import { WebGLPreview } from 'gcode-preview';
import {FileSystemDirectoryEntry, FileSystemFileEntry, NgxFileDropEntry} from 'ngx-file-drop';
import * as THREE from 'three';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
   layersLoaded = 0;
   chunkSize = 250;
  title = 'untitled12';
  file: any;
  preview : any;
  private context: HTMLCanvasElement;
  @ViewChild('myCanvas',{static: false}) canvas: ElementRef;

  public ngOnInit(): void {
  }
  constructor() {
  }
  ngAfterViewInit(){
    this.context = (this.canvas.nativeElement as HTMLCanvasElement);
    console.log('ng after view int work fine ');
    const preview = new WebGLPreview({
      canvas : this.context,
      targetId : 'gcode-preview',
      topLayerColor: new THREE.Color('lime').getHex(),
      lastSegmentColor: new THREE.Color('red').getHex(),
      buildVolume: {x: 250, y: 220, z: 150},
      initialCameraPosition: [0, 400, 450]
    });

    preview.render();
    this.preview = preview;
    console.log(this.canvas);
    window.addEventListener('resize', () => {
      this.preview.resize();
    });
  }

  async fetchGcode(url){
    const response = await fetch(url);

    if (response.status !== 200) {
      throw new Error(`status code: ${response.status}`);
    }

    const file = await response.text();
    return file.split('\n');
  }
  loadPreviewChunked(target, lines, delay) {
    let c = 0;
    const id = '__animationTimer__' + Math.random().toString(36).substr(2, 9);
    const loadProgressive = (preview) => {
      const start = c * this.chunkSize;
      const end = (c + 1) * this.chunkSize;
      const chunk = lines.slice(start, end);
      target.processGCode(chunk);
      target.resize();
        c++;
        if (c * this.chunkSize < lines.length) {
          window[id] = setTimeout(loadProgressive, delay);
        }
      else {
        console.log("a")
      }
    };
    window.clearTimeout(window[id]);
    loadProgressive(target);
  }
   dropped(files: NgxFileDropEntry[]) {
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file(async (file: File) => {
          console.log(file);
          const url = window.URL.createObjectURL(file);
          window.open(url);
          const lines1 = await this.fetchGcode(url);
          this.loadPreviewChunked(this.preview , lines1  , 50);
        });
      } else {
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
        console.log(droppedFile.relativePath, fileEntry);
      }
    }
  }
}
