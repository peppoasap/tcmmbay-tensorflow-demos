/// <reference lib="webworker" />
import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core';
import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter';
import 'https://cdn.jsdelivr.net/npm/@tensorflow-models/body-segmentation';
import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl';
// import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm';
const tf = (self as any).tf;
const bodySegmentation = (self as any).bodySegmentation;
// tf.wasm.setWasmPaths(
//   'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/wasm-out/'
// );
const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
let detector: {
  segmentPeople: (arg0: ImageData, arg1: { flipHorizontal: boolean }) => any;
} | null = null;
let detectorReady = false;
let defaultConfig: any = {
  runtime: 'tfjs',
  modelType: 'general',
};

let inferenceState: 'idle' | 'running' = 'idle';

async function loadModel(config: any = defaultConfig) {
  defaultConfig = config;
  detector = await bodySegmentation.createSegmenter(model, defaultConfig);
  detectorReady = true;
  console.log('DETECTOR LOADED', detector);
}

async function initializeSegmenterDetection() {
  return tf.setBackend('webgl').then(async () => {
    console.time('INITIALIZE SEGMENTOR');
    await loadModel();
    const initImage = new ImageData(640, 480);
    await predict(initImage);
    console.timeEnd('INITIALIZE SEGMENTOR');
  });
}

async function predict(image: ImageData) {
  if (!detectorReady || inferenceState === 'running' || !detector) {
    return;
  }
  inferenceState = 'running';
  const predictions = await detector.segmentPeople(image, {
    flipHorizontal: false,
  });
  if (predictions.length === 0) {
    inferenceState = 'idle';
    return;
  }
  const transferablePrediction = [
    {
      mask: await predictions[0].mask.toImageData(),
    },
  ];

  postMessage(
    {
      type: 'prediction',
      results: transferablePrediction,
      message: 'predicted: ' + transferablePrediction + ' segmentations',
    },
    undefined
  );
  inferenceState = 'idle';
}

addEventListener('message', (ev) => {
  switch (ev.data) {
    case 'initialize':
      initializeSegmenterDetection().then(() => {
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
