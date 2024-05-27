/// <reference lib="webworker" />

import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs';
import 'https://cdn.jsdelivr.net/npm/@tensorflow-models/face-detection';
import 'https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection';
// importScripts(
//   'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@3.21.0'
// );
import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm';
const tf = (self as any).tf;
const faceLandmarksDetection = (self as any).faceLandmarksDetection;
tf.wasm.setWasmPaths(
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/wasm-out/'
);
const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
let detector: {
  estimateFaces: (arg0: any, arg1: { flipHorizontal: boolean }) => any;
} | null = null;
let detectorReady = false;
let defaultConfig: any = {
  runtime: 'tfjs',
  maxFaces: 1,
};

let inferenceState: 'idle' | 'running' = 'idle';

async function loadModel(config: any = defaultConfig) {
  defaultConfig = config;
  detector = await faceLandmarksDetection.createDetector(model, defaultConfig);
  detectorReady = true;
  console.log('DETECTOR LOADED', detector);
}

async function initializeFaceDetection() {
  const d = Date.now();
  return tf.setBackend('wasm').then(async () => {
    console.time(`INITIALIZE_FACEMESH_${d}`);
    await loadModel();
    await predict({
      image: new Int32Array(640 * 480 * 3),
      shape: [480, 640, 3],
    });
    // const initImage = new ImageData(320, 240);
    // await predict(initImage);
    console.timeEnd(`INITIALIZE_FACEMESH_${d}`);
  });
}

async function predict(obj: { image: Int32Array; shape: number[] }) {
  if (!detectorReady || inferenceState === 'running' || !detector) {
    return;
  }
  inferenceState = 'running';
  const tensor = tensorToTensor(obj);
  const predictions = await detector.estimateFaces(tensor, {
    flipHorizontal: false,
  });
  tensor.dispose();
  console.log('PREDICTING....', predictions);
  postMessage(
    {
      type: 'prediction',
      results: predictions,
      message: 'predicted: ' + predictions.length + ' faces',
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
      initializeFaceDetection().then(() => {
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
