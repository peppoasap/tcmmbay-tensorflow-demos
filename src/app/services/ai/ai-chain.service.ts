import { Injectable } from '@angular/core';
import {
  AIBasePrediction,
  AIBaseService,
  FrameInfo,
} from './AIBaseService.interface';
import {
  Observable,
  from,
  BehaviorSubject,
  combineLatest,
  concat,
  concatMap,
  delay,
  map,
  of,
  tap,
  zip,
} from 'rxjs';

/**
 * This service is used to chain AI services together.
 *
 * For example, you can use this service to chain the FaceDetectionService and the HandPoseService together.
 * The chain is responsible to synchronize the predictions of the two services and to provide a unified API.
 *
 * Services that are chained together must implement the AIBaseService interface.
 * Services should be injected dynamically using the Injector service (see https://angular.io/guide/dependency-injection-in-action#dynamic-component-loader).
 *
 * Chain is also responsible for providing "check" functions that can be used to check if the user is looking at the camera, if the user is looking at the screen or doing any action.
 *
 */

@Injectable({
  providedIn: 'root',
})
export class AIBuilder {
  constructor() {}

  /**
   *
   * @param services An array of services that implement the AIBaseService interface.
   * @param checkFunctions An array of functions that will be runned by the chain to check if the user is doing a specific action.
   * @returns A Promise that resolves when all the services are ready.
   */
  createChain(
    services: Array<AIBaseService<any>>,
    checkFunctions?: Array<AIChainCheckFunction>
  ): Observable<AIChain> {
    return new Observable<AIChain>((observer) => {
      const chain = new AIChain(services, checkFunctions);
      chain.initialize().subscribe({
        complete: () => {
          observer.next(chain);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        },
      });
    });
  }
}

export class AIChain {
  isReady = new BehaviorSubject<boolean>(false);
  // checkFunctions: Array<AIChainCheckFunction> = [];
  predictions: Map<string, Array<AIBasePrediction<any>>> = new Map();

  /**
   *
   * @param services An array of services that implement the AIBaseService interface.
   */
  constructor(
    public services: Array<AIBaseService<any>>,
    checkFunctions?: Array<AIChainCheckFunction>
  ) {
    combineLatest(
      this.services.map((service) => service.isReady.asObservable())
    ).subscribe((readyArray) => {
      if (readyArray.every((ready) => ready)) {
        this.isReady.next(true);
      }
    });

    // if (checkFunctions) {
    //   this.checkFunctions = checkFunctions;
    // }
  }

  /**
   *
   * @param delayShardTime The delay time between the initialization of each service.
   * @returns An observable that emits the initialization status of each service.
   */
  initialize(delayShardTime = 250) {
    return concat(this.services.map((service) => service.initialize())).pipe(
      concatMap((_) => of(_).pipe(delay(delayShardTime)))
    );
  }

  /**
   *
   * @returns A Promise that resolves when all the services are ready.
   */

  async predict(input: HTMLVideoElement) {
    if (input.videoWidth === 0 || input.videoHeight === 0) return;
    await Promise.all(this.services.map((service) => service.predict(input)));
  }

  /**
   *
   * @returns A Promise that resolves when all the services are ready.
   */
  handle() {
    return zip(
      ...this.services.map((service) => service.predictions.asObservable())
    ).pipe(
      map(
        (predictions) => (this.predictions = this.predictionsToMap(predictions))
      )
      // map((predictions) => this.runCheckFunctions(predictions))
    );
  }

  // addCheckFunction(checkFunction: AIChainCheckFunction) {
  //   this.checkFunctions.push(checkFunction);
  // }

  /**
   *
   * @param predictions An array of predictions from the services.
   * @returns A boolean that indicates if the check functions are satisfied.
   */
  // runCheckFunctions(
  //   predictions: Map<string, Array<AIBasePrediction<any>>> = this.predictions
  // ): AIChainCheckResult[] {
  //   const checkResults: AIChainCheckResult[] = [];
  //   if (this.checkFunctions.length > 0) {
  //     this.checkFunctions.forEach((checkFunction) => {
  //       checkResults.push(checkFunction(predictions));
  //     });
  //   } else {
  //     console.warn('No check functions defined for this chain.');
  //     checkResults.push({
  //       name: 'empty',
  //       frame: predictions.get(predictions.keys().next().value)[0].frameInfo,
  //       result: false,
  //       predictions: predictions,
  //     });
  //   }

  //   return checkResults;
  // }

  draw(
    canvas: HTMLCanvasElement,
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    inputOnly = false
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(input, 0, 0, ctx.canvas.width, ctx.canvas.height);
    if (!inputOnly) this.services.forEach((service) => service.draw(ctx));
    ctx.restore();
  }

  /**
   *
   * @returns A Promise that resolves when all the services are ready.
   */
  async stop() {
    await Promise.all(this.services.map((service) => service.stop()));
  }

  private predictionsToMap(
    predictions: AIBasePrediction<any>[][]
  ): Map<string, AIBasePrediction<any>[]> {
    const map = new Map<string, AIBasePrediction<any>[]>();
    predictions.forEach((prediction) => {
      map.set(prediction[0].predictionType, prediction);
    });
    return map;
  }
}

// Interface for the AIChainService to define the check function that must be runned by the chain.
export interface AIChainCheckFunction<T = boolean> {
  (predictions: Map<string, AIBasePrediction<any>[]>): AIChainCheckResult<T>;
}

export interface AIChainCheckResult<T = boolean> {
  name: string;
  frame: FrameInfo;
  result: T;
  predictions: Map<string, AIBasePrediction<any>[]>;
}
