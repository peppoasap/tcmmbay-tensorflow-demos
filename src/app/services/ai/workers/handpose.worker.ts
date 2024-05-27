/// <reference lib="webworker" />
import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs';
import 'https://cdn.jsdelivr.net/npm/@mediapipe/hands';
import 'https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection';

// importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl');

import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm';
const tf = (self as any).tf;

tf.wasm.setWasmPaths(
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/wasm-out/'
);

const handPoseDetection = (self as any).handPoseDetection;
const model = handPoseDetection.SupportedModels.MediaPipeHands;
let detector: {
  estimateHands: (arg0: any, arg1: { flipHorizontal: boolean }) => any;
} | null = null;
let detectorReady = false;
let defaultConfig: any = {
  runtime: 'tfjs',
  modelType: 'lite',
  maxHands: 1,
};

let inferenceState: 'idle' | 'running' = 'idle';

async function loadModel(config: any = defaultConfig) {
  defaultConfig = config;
  detector = await handPoseDetection.createDetector(model, defaultConfig);
  detectorReady = true;
  console.log('DETECTOR LOADED', detector);
}

async function initializeHandDetection() {
  return tf.setBackend('wasm').then(async () => {
    const d = Date.now();
    console.time(`INITIALIZE_HANDPOSE_${d}`);
    await loadModel().then(async () => {});
    await predict({
      image: new Int32Array(640 * 480 * 3),
      shape: [480, 640, 3],
    });
    console.timeEnd(`INITIALIZE_HANDPOSE_${d}`);
  });
}

async function predict(obj: { image: Int32Array; shape: number[] }) {
  if (!detectorReady || inferenceState === 'running' || !detector) {
    return;
  }
  inferenceState = 'running';
  const tensor = tensorToTensor(obj);
  const predictions = await detector.estimateHands(tensor, {
    flipHorizontal: false,
  });
  tensor.dispose();
  postMessage(
    {
      type: 'prediction',
      results: predictions,
      message: 'predicted: ' + predictions.length + ' hands',
    },
    undefined
  );
  inferenceState = 'idle';
}

function tensorToTensor(input: { image: Int32Array; shape: number[] }) {
  const width = input.shape[1] || 640;
  const height = input.shape[0] || 480;
  return tf.tidy(() => {
    let img = tf.tensor(input.image, [height, width, 3]);
    // img = tf.image.resizeBilinear(img, size);
    return img;
  });
}

addEventListener('message', (ev) => {
  switch (ev.data) {
    case 'initialize':
      initializeHandDetection().then(() => {
        postMessage({
          type: 'initialized',
          message: 'initialized',
        });
      });
      break;
    default:
      predict(ev.data);
      break;
  }
});

// used to avoid TS error "Cannot redeclare block-scoped variable" when using "importScripts" in a web worker file
export {};
