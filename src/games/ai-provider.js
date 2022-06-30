import {Hands} from '@mediapipe/hands';
// import {HAND_CONNECTIONS} from '@mediapipe/hands';
import {SelfieSegmentation} from '@mediapipe/selfie_segmentation';
import * as cam from '@mediapipe/camera_utils';
import {getHandAverage, scalePoints} from './util.js';
import {videoWidth, videoHeight} from './constants.js';

export default class AIProvider {
  constructor(onHandResults, webcamRef, ctx, mode) {
    this.onHandResults = onHandResults;
    this.ctx = ctx;
    this.mode = mode;

    this.segmentationResultsCaller = this.segmentationResultsCaller.bind(this);
    this.handResultsCaller = this.handResultsCaller.bind(this);

    const hands = new Hands({
      locateFile:(file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.3.1632795355/${file}`;
      }
    });
    const selfieSegmentation = new SelfieSegmentation({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      }
    });

    selfieSegmentation.setOptions({
      modelSelection: 1,
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.2
    });

    selfieSegmentation.onResults(this.segmentationResultsCaller);
    hands.onResults(this.handResultsCaller);

    const camera = new cam.Camera(webcamRef, {
      onFrame: async () => {
        await selfieSegmentation.send({image: webcamRef});
        await hands.send({image: webcamRef});
      },
      width: videoWidth,
      height: videoHeight
    });
    camera.start();
  }

  segmentationResultsCaller(results) {
    this.ctx.save();

    this.ctx.clearRect(0, 0, videoWidth, videoHeight);
    this.ctx.drawImage(results.segmentationMask, 0, 0, videoWidth, videoHeight);
    this.ctx.globalCompositeOperation = 'source-in';
    this.ctx.drawImage(results.image, 0, 0, videoWidth, videoHeight);
    this.ctx.globalCompositeOperation = 'source-over';

    this.ctx.restore();
  }

  handResultsCaller(results) {
    let averagePoints = getHandAverage(
      results.multiHandLandmarks,
      results.multiHandedness,
      this.mode
    );

    averagePoints = scalePoints(averagePoints);
    this.ctx.save();
    if (results.multiHandLandmarks) {
      for (let i=0; i<results.multiHandLandmarks.length; i++) {
        const key = parseInt(Object.keys(averagePoints)[i]);
        if (isNaN(key)) {
          continue;
        }
        // window.drawConnectors(this.ctx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
        this.ctx.beginPath();
        this.ctx.arc(averagePoints[key].x, averagePoints[key].y, 25, 0, 2*Math.PI);
        this.ctx.fillStyle = 'cyan';
        this.ctx.fill();
      }
    }
    this.ctx.restore();
    this.onHandResults(averagePoints);
  }
}
