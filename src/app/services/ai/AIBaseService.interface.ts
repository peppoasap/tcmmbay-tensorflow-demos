import { BehaviorSubject } from 'rxjs';

export interface AIBaseService<T> {
  isReady: BehaviorSubject<boolean>;
  predictions: BehaviorSubject<AIBasePrediction<T>[]>;
  worker: Worker | undefined;
  frameInfo: FrameInfo;
  handleWorkerMessage(event: MessageEvent<AIWorkerDataMessage>): void;
  initialize(): void;
  predict(input: HTMLVideoElement): void;
  handle(predictions: T[]): void;
  inputToTensor(
    input: HTMLVideoElement | HTMLImageElement
  ): Promise<Float32Array | Int32Array | Uint8Array | null>;
  rawPredictionsToPredictions(rawPredictions: T[]): AIBasePrediction<T>;
  stop: () => boolean;
  draw: (ctx: CanvasRenderingContext2D) => void;
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

export interface AIBasePrediction<T> {
  frameInfo: FrameInfo;
  predictionType: string;
  data: T[];
}

export interface FrameInfo {
  frame: number;
  timestamp: number;
}

export interface Point {
  x: number;
  y: number;
  z: number;
  name?: string;
}

export class AIUtils {
  static HALF_CURL_START_LIMIT = 60.0;
  static NO_CURL_START_LIMIT = 130.0;
  // Math utilities for 2d/3d geometry
  static withinRange(
    input1: number,
    input2: number,
    deviation: number
  ): boolean {
    return Math.abs(input1 - input2) <= deviation;
  }

  static outsideRange(
    input1: number,
    input2: number,
    deviation: number
  ): boolean {
    return Math.abs(input1 - input2) > deviation;
  }

  static checkIfAnyPointIsWithinRange(
    points: Array<Point>,
    x: number,
    y: number,
    range: number
  ): boolean {
    if (!points) {
      return false;
    }
    const isWithinRange = points.some((point) => {
      return (
        this.withinRange(point.x, x, range) &&
        this.withinRange(point.y, y, range)
      );
    });
    return isWithinRange;
  }
}
