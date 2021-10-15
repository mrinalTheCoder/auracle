import {Hands} from '@mediapipe/hands';
import {HAND_CONNECTIONS} from '@mediapipe/hands';
import {SelfieSegmentation} from '@mediapipe/selfie_segmentation';
import Webcam from 'react-webcam';
import * as cam from '@mediapipe/camera_utils';
import {getHandAverage, getDistance} from './util.js';
import {Midpoint} from './util.js';
import {Target} from './base-classes.js';
import {TARGETSIZE, NOOB, TOUCHED, ROLE_BIN} from './constants.js';
import {DROPPEDSOUND, BINSOUND, WRONGBINSOUND, LOSTHANDSOUND, TIMEOUT_FRAMES} from './constants.js';
import {videoWidth, videoHeight} from './constants.js';
import React from 'react';

const optionPositions = [
  {x: TARGETSIZE, y: TARGETSIZE},
  {x: TARGETSIZE, y: videoHeight/2},
  {x: TARGETSIZE, y: videoHeight - TARGETSIZE}
];
const optionColors = ['yellow', 'blue', 'black'];
const targetPosition = {x: videoWidth - TARGETSIZE, y: videoHeight/2};

class Circle extends Target {
  constructor(x, y, color, size=TARGETSIZE) {
    super(x, y, 'Circle', size);
    this.midpoint = new Midpoint();
    this.color = color;
  }

  drawPosition(ctx) {
    super.drawPosition(ctx);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size/2, 0, 2 * Math.PI, this.color);
    ctx.closePath();
    ctx.fill();
    this.midpoint.drawPosition(ctx, this.pos);
  }
}

class ColorPicking extends React.Component {
  constructor(props) {
    super(props);

    this.handPoint = {};
    this.target = null;
    this.options = [];
    this.score = 0;
    this.frameCount = 0;
    this.isResetting = false;

    this.onSegmentationResults = this.onSegmentationResults.bind(this);
    this.onHandResults = this.onHandResults.bind(this);
  }
  componentDidMount() {
    this.webcamRef = document.getElementById('webcam');
    this.canvasRef = document.getElementById('canvas');
    this.displayStyle = {
      position: 'absolute',
      marginRight: 'auto',
      marginLeft: 'auto',
      left: 0, right: 0,
      textAlign: 'center',
      width: videoWidth, height: videoHeight
    };

    const hands = new Hands({
      locateFile:(file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
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
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.2
    });

    selfieSegmentation.onResults(this.onSegmentationResults);
    hands.onResults(this.onHandResults);

    const camera = new cam.Camera(this.webcamRef, {
      onFrame:async () => {
        await selfieSegmentation.send({image: this.webcamRef});
        await hands.send({image: this.webcamRef});
      },
      width: videoWidth,
      height: videoHeight
    });
    camera.start();

    this.canvasRef.width = videoWidth;
    this.canvasRef.height = videoHeight;
    this.canvasElement = this.canvasRef;
    this.ctx = this.canvasElement.getContext('2d');
    this.ctx.translate(videoWidth, 0);
    this.ctx.scale(-1, 1);
  }

  onHandResults(results) {
    let averagePoints = getHandAverage(results.multiHandLandmarks, results.multiHandedness);
    averagePoints = this.scaleAveragePoints(averagePoints);
    this.ctx.save();
    if (results.multiHandLandmarks) {
      for (let i=0; i<results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const key = parseInt(Object.keys(averagePoints)[i]);
        if (isNaN(key)) {
          continue;
        }
        this.handPoint[key] = new Midpoint();
        window.drawConnectors(this.ctx, landmarks, HAND_CONNECTIONS,
                       {color: '#00FF00', lineWidth: 5});
        window.drawLandmarks(this.ctx, landmarks, {color: '#FF0000', lineWidth: 2});
      }
    }
    this.ctx.restore();

    if (this.frameCount === 40) {
      this.frameCount = 0;
      this.isResetting = false;
    }
    if (this.isResetting) {
      this.frameCount += 1;
      return;
    }

    if (this.target === null) {
      for (let i=0; i<optionColors.length; i++) {
        this.options.push(new Circle(optionPositions[i].x, optionPositions[i].y, optionColors[i]));
      }
      let toss = Math.random();
      if (toss >.66) {
        this.target = new Circle(targetPosition.x, targetPosition.y, 'yellow');
      } else if (toss > .33){
        this.target = new Circle(targetPosition.x, targetPosition.y, 'blue');
      } else {
        this.target = new Circle(targetPosition.x, targetPosition.y, 'black');
      }
    }

    this.target.drawPosition(this.ctx);
    for (let i=0; i<this.options.length; i++) {
      this.options[i].drawPosition(this.ctx);
      for (const [hand, pos] of Object.entries(averagePoints)) {
        if (getDistance(pos, this.options[i].pos) <= 60) {
          if (this.options[i].matches(this.target, 'color')) {
            var binAudio = new Audio(BINSOUND);
            binAudio.play();
          } else {
            var wrongBinAudio = new Audio(WRONGBINSOUND);
            wrongBinAudio.play();
          }
          this.target = null;
          this.isResetting = true;
          return;
        }
      }
    }
  }

  scaleAveragePoints(averagePoints) {
    for (const hand of Object.keys(averagePoints)) {
      averagePoints[hand].x *= videoWidth;
      averagePoints[hand].y *= videoHeight;
    }
    return averagePoints;
  }

  onSegmentationResults(results) {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    this.ctx.drawImage(results.segmentationMask, 0, 0,
                        this.canvasElement.width, this.canvasElement.height);
    this.ctx.globalCompositeOperation = 'source-in';
    this.ctx.drawImage(
        results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
    this.ctx.restore();
  }

  render() {
    return (
      <div className="App">
        <br/>
        <br/>
        <Webcam id='webcam' style={{display:'none'}} />
        <canvas id='canvas' style={this.displayStyle} ></canvas>
      </div>
    );
  }
}

export default ColorPicking;
