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

export const FacemeshInjector = () => new FacemeshService();

@Injectable({
  providedIn: 'any',
})
export class FacemeshService implements AIBaseService<FacemeshPrediction> {
  isReady = new BehaviorSubject<boolean>(false);
  predictions = new BehaviorSubject<AIBasePrediction<FacemeshPrediction>[]>([]);
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
          new URL('workers/facemesh.worker', import.meta.url)
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
    await ready();
    const tensor = browser.fromPixels(input);
    const image = tensor.dataSync();
    tensor.dispose();
    return image;
  }

  async predict(input: HTMLVideoElement) {
    const image = await this.inputToTensor(input);

    if (this.worker) {
      this.worker.postMessage(
        {
          image,
          shape: [input.videoHeight, input.videoWidth],
        },
        [image.buffer]
      );
    }
  }

  handle(rawPredictions: FacemeshBasePrediction[]) {
    this.frameInfo = {
      frame: this.frameInfo.frame + 1,
      timestamp: Date.now(),
    };

    const rawPredictionsWithAnnotations = rawPredictions.map((prediction) =>
      addAnnotationsFromFacemeshKeypoints(prediction)
    );

    this.predictions.next([
      this.rawPredictionsToPredictions(rawPredictionsWithAnnotations),
      ...this.predictions.value,
    ]);
  }

  rawPredictionsToPredictions(
    rawPredictions: FacemeshPrediction[]
  ): AIBasePrediction<FacemeshPrediction> {
    return {
      frameInfo: this.frameInfo,
      predictionType: 'facemesh',
      data: rawPredictions,
    } as AIBasePrediction<FacemeshPrediction>;
  }

  stop(): boolean {
    if (this.worker) this.worker.terminate();
    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';
    ctx.lineWidth = 0.2;
    const predictions = this.predictions.value[0].data;
    if (predictions.length > 0) {
      const keypoints = predictions[0].keypoints;
      for (const point of keypoints) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      this.drawBoundingBox(predictions[0].box, ctx);
    }
  }

  drawBoundingBox(box: FacemeshBox, ctx: CanvasRenderingContext2D) {
    //find the top right and bottom left corners of the bounding box from topLeft and bottomRight
    const topLeft = [box.xMin, box.yMin];
    const bottomRight = [box.xMax, box.yMax];
    const topRight = [box.xMax, box.yMin];
    const bottomLeft = [box.xMin, box.yMax];

    ctx.strokeStyle = 'green';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(topLeft[0], topLeft[1]);
    ctx.lineTo(topRight[0], topRight[1]);
    ctx.lineTo(bottomRight[0], bottomRight[1]);
    ctx.lineTo(bottomLeft[0], bottomLeft[1]);
    ctx.lineTo(topLeft[0], topLeft[1]);
    ctx.stroke();
    this.drawBoundingBoxCenter(box, ctx);
  }

  drawBoundingBoxCenter(box: FacemeshBox, ctx: CanvasRenderingContext2D) {
    const center = this.findBoundingBoxCenter(box);
    ctx.fillStyle = 'red';
    ctx.fillRect(center.x, center.y, 10, 10);
  }

  findBoundingBoxCenter(box: FacemeshBox): Omit<Point, 'z' | 'name'> {
    const centerPoint = {
      x: (box.xMax + box.xMin) / 2,
      y: (box.yMax + box.yMin) / 2,
    };

    return centerPoint;
  }
}

interface Point {
  x: number;
  y: number;
  z: number;
  name?: string;
}

interface FacemeshBox {
  width: number;
  height: number;
  xMax: number;
  xMin: number;
  yMax: number;
  yMin: number;
}

interface FacemeshBasePrediction {
  box: FacemeshBox;
  keypoints: Array<Point>;
}

interface FacemeshAnnotations {
  silhouette: Array<Point>;
  moustache: Array<Point>;
  lipsUpperOuter: Array<Point>;
  lipsLowerOuter: Array<Point>;
  lipsUpperInner: Array<Point>;
  lipsLowerInner: Array<Point>;
  rightEyeUpper0: Array<Point>;
  rightEyeLower0: Array<Point>;
  rightEyeUpper1: Array<Point>;
  rightEyeLower1: Array<Point>;
  rightEyeUpper2: Array<Point>;
  rightEyeLower2: Array<Point>;
  rightEyeUpper3: Array<Point>;
  rightEyeLower3: Array<Point>;
  rightEyebrowUpper: Array<Point>;
  rightEyebrowLower: Array<Point>;
  leftEyeUpper0: Array<Point>;
  leftEyeLower0: Array<Point>;
  leftEyeUpper1: Array<Point>;
  leftEyeLower1: Array<Point>;
  leftEyeUpper2: Array<Point>;
  leftEyeLower2: Array<Point>;
  leftEyeUpper3: Array<Point>;
  leftEyeLower3: Array<Point>;
  leftEyebrowUpper: Array<Point>;
  leftEyebrowLower: Array<Point>;
  midwayBetweenEyes: Array<Point>;
  noseTip: Array<Point>;
  noseBottom: Array<Point>;
  noseRightCorner: Array<Point>;
  noseLeftCorner: Array<Point>;
  rightCheek: Array<Point>;
  leftCheek: Array<Point>;
  [key: string]: Array<Point>;
}
export interface FacemeshPrediction extends FacemeshBasePrediction {
  annotations: FacemeshAnnotations;
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

export const MESH_ANNOTATIONS: { [key: string]: number[] } = {
  silhouette: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
    378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
    162, 21, 54, 103, 67, 109,
  ],

  moustache: [186, 164, 410],
  lipsUpperOuter: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
  lipsLowerOuter: [146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
  lipsUpperInner: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308],
  lipsLowerInner: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308],

  rightEyeUpper0: [246, 161, 160, 159, 158, 157, 173],
  rightEyeLower0: [33, 7, 163, 144, 145, 153, 154, 155, 133],
  rightEyeUpper1: [247, 30, 29, 27, 28, 56, 190],
  rightEyeLower1: [130, 25, 110, 24, 23, 22, 26, 112, 243],
  rightEyeUpper2: [113, 225, 224, 223, 222, 221, 189],
  rightEyeLower2: [226, 31, 228, 229, 230, 231, 232, 233, 244],
  rightEyeLower3: [143, 111, 117, 118, 119, 120, 121, 128, 245],

  rightEyebrowUpper: [156, 70, 63, 105, 66, 107, 55, 193],
  rightEyebrowLower: [35, 124, 46, 53, 52, 65],

  rightEyeIris: [473, 474, 475, 476, 477],

  leftEyeUpper0: [466, 388, 387, 386, 385, 384, 398],
  leftEyeLower0: [263, 249, 390, 373, 374, 380, 381, 382, 362],
  leftEyeUpper1: [467, 260, 259, 257, 258, 286, 414],
  leftEyeLower1: [359, 255, 339, 254, 253, 252, 256, 341, 463],
  leftEyeUpper2: [342, 445, 444, 443, 442, 441, 413],
  leftEyeLower2: [446, 261, 448, 449, 450, 451, 452, 453, 464],
  leftEyeLower3: [372, 340, 346, 347, 348, 349, 350, 357, 465],

  leftEyebrowUpper: [383, 300, 293, 334, 296, 336, 285, 417],
  leftEyebrowLower: [265, 353, 276, 283, 282, 295],

  leftEyeIris: [468, 469, 470, 471, 472],

  midwayBetweenEyes: [168],

  noseTip: [1],
  noseBottom: [2],
  noseRightCorner: [98],
  noseLeftCorner: [327],

  rightCheek: [205],
  leftCheek: [425],
};

function addAnnotationsFromFacemeshKeypoints(
  prediction: FacemeshBasePrediction
): FacemeshPrediction {
  const annotations = {} as FacemeshAnnotations;
  for (const key in MESH_ANNOTATIONS) {
    annotations[key] = MESH_ANNOTATIONS[key].map(
      (index) => prediction.keypoints[index]
    );
  }

  return {
    ...prediction,
    annotations,
  };
}
