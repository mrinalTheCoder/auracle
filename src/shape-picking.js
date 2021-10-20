import {Hands} from '@mediapipe/hands';
import {HAND_CONNECTIONS} from '@mediapipe/hands';
import {SelfieSegmentation} from '@mediapipe/selfie_segmentation';
import Webcam from 'react-webcam';
import * as cam from '@mediapipe/camera_utils';
import {getHandAverage, getDistance, shuffle} from './util.js';
import {Midpoint} from './util.js';
import {Target} from './base-classes.js';
import {TARGETSIZE, BINSOUND, WRONGBINSOUND} from './constants.js';
import {videoWidth, videoHeight} from './constants.js';
import React from 'react';

const optionPositions = [
  {x: TARGETSIZE, y: TARGETSIZE},
  {x: TARGETSIZE, y: videoHeight/2},
  {x: TARGETSIZE, y: videoHeight - TARGETSIZE}
];
const optionShapes = ['Circle', 'Triangle', 'Square', 'Star', 'Diamond'];
const targetPosition = {x: videoWidth - TARGETSIZE, y: videoHeight/2};

class Shape extends Target {
  constructor(x, y, shape, color) {
    super(x, y, shape, TARGETSIZE);
    this.midpoint = new Midpoint();
    this.color = color;
  }

  drawPosition(ctx) {
    super.drawPosition(ctx);
    ctx.fillStyle = this.color;
    if (this.shape === 'Circle') {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.size/2, 0, 2 * Math.PI, this.color);
      ctx.closePath();
      ctx.fill();
    } else if (this.shape === 'Square') {
      ctx.fillRect(this.pos.x- this.size/2, this.pos.y -this.size/2, this.size, this.size);
    } else if (this.shape === 'Triangle') {
      ctx.beginPath();
      ctx.moveTo(this.pos.x  - this.size/2, this.pos.y+this.size/(2*Math.sqrt(3)));
      ctx.lineTo(this.pos.x + this.size/2, this.pos.y+ this.size/(2*Math.sqrt(3)));
      ctx.lineTo(this.pos.x, this.pos.y - this.size/(Math.sqrt(3)));
      ctx.fill();
    } else if (this.shape === 'Star') {
      let rot = Math.PI / 2 * 3;
      let step = Math.PI / 5;
      let x = this.pos.x;
      let y = this.pos.y;
      ctx.beginPath();
      ctx.moveTo(this.pos.x, this.pos.y - this.size/2)
      for (let i=0; i<5; i++) {
        x = this.pos.x + Math.cos(rot) * this.size/2;
        y = this.pos.y + Math.sin(rot) * this.size/2;
        ctx.lineTo(x, y)
        rot += step
        x = this.pos.x + Math.cos(rot) * this.size/4;
        y = this.pos.y + Math.sin(rot) * this.size/4;
        ctx.lineTo(x, y)
        rot += step
      }
      ctx.lineTo(this.pos.x, this.pos.y - this.size/2)
      ctx.closePath();
      ctx.fill();
    } else if (this.shape === 'Diamond') {
      ctx.beginPath();
      ctx.moveTo(this.pos.x, this.pos.y);
      ctx.lineTo(this.pos.x+this.size/2, this.pos.y+this.size/2);
      ctx.lineTo(this.pos.x, this.pos.y+this.size);
      ctx.lineTo(this.pos.x-this.size/2, this.pos.y+this.size/2);
      ctx.closePath();
      ctx.fill();
    }
    this.midpoint.drawPosition(ctx, this.pos);
  }
}

class ShapePicking extends React.Component {
  constructor(props) {
    super(props);

    this.state = {score: 0, total: 0};
    this.handPoint = {};
    this.target = null;
    this.options = [];
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
      const randomShapes = shuffle(optionShapes).slice(-3);
      for (let i=0; i<optionPositions.length; i++) {
        this.options.push(new Shape(optionPositions[i].x, optionPositions[i].y, randomShapes[i], 'yellow'));
      }
      let toss = Math.floor(Math.random()*3);
      this.target = new Shape(targetPosition.x, targetPosition.y, randomShapes[toss], 'green');
    }

    this.target.drawPosition(this.ctx);
    for (let i=0; i<this.options.length; i++) {
      this.options[i].drawPosition(this.ctx);
      for (const temp of Object.entries(averagePoints)) {
        const pos = temp[1];
        if (getDistance(pos, this.options[i].pos) <= 60) {
          if (this.options[i].matches(this.target, 'shape')) {
            this.setState({score: this.state.score + 1});
            var binAudio = new Audio(BINSOUND);
            binAudio.play();
          } else {
            var wrongBinAudio = new Audio(WRONGBINSOUND);
            wrongBinAudio.play();
          }
          this.setState({total: this.state.total + 1});
          this.target = null;
          this.options = [];
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
        {(this.state.total < 10) ? (
          <>
            <h1>Match the shapes</h1>
            <p>Score: {this.state.score} out of {this.state.total}</p>
            <Webcam id='webcam' style={{display:'none'}} />
            <canvas id='canvas' style={this.displayStyle} ></canvas>
          </>
        ) : (
          <>
            <div style={{margin: 'auto'}}>
              <h1>Final Score: {this.state.score}/{this.state.total}</h1>
            </div>
          </>
        )}

      </div>
    );
  }
}

export default ShapePicking;
