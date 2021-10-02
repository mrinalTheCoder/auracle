import './App.css';
import {Hands} from '@mediapipe/hands';
import {HAND_CONNECTIONS} from '@mediapipe/hands';
import Webcam from 'react-webcam';
import * as cam from '@mediapipe/camera_utils';
import {randomNumber, getHandAverage, getDistance} from './util.js';
import React from 'react';

const videoWidth = 640 * 1.5;
const videoHeight = 480 * 1.5;

class Target {
  constructor() {
    this.pos = {
      x: randomNumber(10, videoWidth-10),
      y: randomNumber(10, videoHeight-10)
    };
    this.frames = 0;
  }

  drawPosition(ctx) {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 40, 0, 2 * Math.PI, 'yellow');
    ctx.closePath();
    ctx.fill();
    this.frames += 1
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.targets = [];
    this.score = 0;
    this.onResults = this.onResults.bind(this);
    this.updateTargets = this.updateTargets.bind(this);
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
    hands.setOptions({
      maxNumHands: 2,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    hands.onResults(this.onResults);

    const camera = new cam.Camera(this.webcamRef, {
      onFrame:async () => {
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

  onResults(results) {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    this.ctx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        window.drawConnectors(this.ctx, landmarks, HAND_CONNECTIONS,
                       {color: '#00FF00', lineWidth: 5});
        window.drawLandmarks(this.ctx, landmarks, {color: '#FF0000', lineWidth: 2});
      }
    }
    this.ctx.restore();
    if (this.targets.length === 0) {
      this.targets.push(new Target());
    }
    this.updateTargets(getHandAverage(results.multiHandLandmarks));
  }

  updateTargets(averagePoints) {
    console.log(this.score);
    for (var i=0; i < this.targets.length; i++) {
      let touching = false;
      for (var j=0; j<averagePoints.length; j++) {
        averagePoints[j].x *= videoWidth;
        averagePoints[j].y *= videoHeight;
        if (getDistance(this.targets[i].pos, averagePoints[j]) <= 50) {
          touching = true;
          break;
        }
      }
      if (touching) {
        this.score += 1;
        this.targets[i] = null;
        this.targets = this.targets.splice(i, 0);
      } else if (this.targets[i].frames > 50) {
        this.targets[i] = null;
        this.targets = this.targets.splice(i, 0);
      } else {
        this.targets[i].drawPosition(this.ctx);
      }
    }
  }

  render() {
    return (
      <div className="App">
        <Webcam id='webcam' style={{display:'none'}} />
        <canvas id='canvas' style={this.displayStyle} ></canvas>
      </div>
    );
  }
}

export default App;
