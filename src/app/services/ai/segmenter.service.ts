import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ready, browser, setBackend } from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import { AIBasePrediction, AIBaseService } from './AIBaseService.interface';
setWasmPaths(
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/wasm-out/'
);
setBackend('wasm').then(() => console.log('set backend to wasm'));

export const SegmenterInjector = () => new SegmenterService();

@Injectable({
  providedIn: 'any',
})
export class SegmenterService implements AIBaseService<SegmenterPrediction> {
  isReady = new BehaviorSubject<boolean>(false);
  predictions = new BehaviorSubject<AIBasePrediction<SegmenterPrediction>[]>(
    []
  );
  worker: Worker | undefined;
  frameInfo = {
    frame: 0,
    timestamp: 0,
  };

  constructor() {}

  async initialize() {
    if (this.isReady.value) return;
    if (typeof Worker !== 'undefined') {
      if (!this.worker) {
        this.worker = new Worker(
          new URL('workers/segmenter.worker', import.meta.url)
        );
        this.worker.onmessage = (ev) => {
          this.handleWorkerMessage(ev);
        };
        this.worker.postMessage('initialize');
      }
    }
  }

  handleWorkerMessage(event: MessageEvent<AIWorkerDataMessage>) {
    const data = event.data;
    switch (data.type) {
      case 'initialized':
        this.isReady.next(true);
        break;
      case 'prediction':
        this.handle(data.results);
        break;
    }
  }

  async inputToTensor(input: HTMLVideoElement | HTMLImageElement) {
    if (input) {
      await ready();
      const tensor = browser.fromPixels(input);
      const image = tensor.dataSync();
      tensor.dispose();
      return image;
    }
    return null;
  }

  async predict(input: HTMLVideoElement) {
    const offscreenCanvas = new OffscreenCanvas(input.width, input.height);
    const offscreenCanvasCtx = offscreenCanvas.getContext('2d');
    offscreenCanvasCtx?.drawImage(input, 0, 0);
    const imageData = offscreenCanvasCtx?.getImageData(
      0,
      0,
      input.width,
      input.height
    );
    if (this.worker && imageData) {
      this.worker.postMessage(imageData, [imageData.data.buffer]);
    }
  }

  handle(rawPredictions: SegmenterPrediction[]) {
    this.frameInfo = {
      frame: this.frameInfo.frame + 1,
      timestamp: Date.now(),
    };

    this.predictions.next([
      this.rawPredictionsToPredictions(rawPredictions),
      ...this.predictions.value,
    ]);
  }

  rawPredictionsToPredictions(
    rawPredictions: SegmenterPrediction[]
  ): AIBasePrediction<SegmenterPrediction> {
    return {
      frameInfo: this.frameInfo,
      predictionType: 'segmenter',
      data: rawPredictions,
    } as AIBasePrediction<SegmenterPrediction>;
  }

  stop(): boolean {
    if (this.worker) this.worker.terminate();
    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const prediction = this.predictions.value[0]?.data[0];
    if (!prediction) return;
    const maskCanvas = new OffscreenCanvas(
      prediction.mask.width,
      prediction.mask.height
    );
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) {
      return;
    }
    maskCtx.putImageData(prediction.mask, 0, 0);
    ctx.globalCompositeOperation = 'destination-atop';
    ctx.drawImage(
      maskCanvas,
      0,
      0,
      prediction.mask.width,
      prediction.mask.height
    );
  }
}

interface Point {
  x: number;
  y: number;
  z: number;
  name?: string;
}

export interface SegmenterPrediction {
  mask: ImageData;
}

export class AIWorkerDataMessage {
  type: string;
  results: any;
  message: string;

  constructor(type: string, results: any, message: string) {
    this.type = type;
    this.results = results;
    this.message = message;
  }
}
