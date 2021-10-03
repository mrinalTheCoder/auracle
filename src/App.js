import './App.css';
import {Hands} from '@mediapipe/hands';
import {HAND_CONNECTIONS} from '@mediapipe/hands';
import Webcam from 'react-webcam';
import * as cam from '@mediapipe/camera_utils';
import {randomNumber, getHandAverage, getDistance} from './util.js';
import React from 'react';

const videoWidth = 640 * 1.5;
const videoHeight = 480 * 1.5;

const TARGETSIZE = 80;

const NOOB = 1;
const TOUCHED = 2;
const BINNED = 3;

const binPositions=[{x:videoWidth -150, y:videoHeight - 120},
  {x:videoWidth -150, y:videoHeight - 300}];


class Target {
  constructor(shape,size) {
    this.pos = {
      x: randomNumber(10, videoWidth-10),
      y: randomNumber(10, videoHeight-10),
    };
    this.size = size;
    this.shape = shape;
    this.frames = 0;
    this.color = 'yellow';
    this.touched = false;
    this.touchedFrames = 0;
    this.followingHand = '';
    this.state = NOOB;
  }

  updateProp(size, color, pos) {
    this.size = size;
    this.color = color;
    this.updatePosition(pos);
  }

  touch(hand) {
    this.state = TOUCHED;
    this.color = 'red';
    this.followingHand = hand;
  }

  binned() {
    this.state = BINNED;
  }

  updatePosition(pos) {
    this.pos = pos
  }

  drawPosition(ctx) {
    this.frames += 1;
    if (this.state == TOUCHED) {
      this.touchedFrames += 1;
    }
  }

  matches(target) {
    return(this.shape===target.shape);
  }
}

class Circle extends Target {
  constructor(size=TARGETSIZE) {
    super('Circle', size);
  }

  drawPosition(ctx) {
    super.drawPosition(ctx);
    ctx.fillStyle = this.color;
    console.log(this.color);
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size/2, 0, 2 * Math.PI, this.color);
    ctx.closePath();
    ctx.fill();
  }
}

class Square extends Target {
  constructor(size=TARGETSIZE) {
    super('Square', size);
  }

  drawPosition(ctx) {
    super.drawPosition(ctx);
    ctx.fillStyle = this.color;
    //ctx.beginPath();
    ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size);
    //ctx.closePath();
    //ctx.fill();
  }
}


class App extends React.Component {
  constructor(props) {
    super(props);
    this.targets = [];
    this.bins = [];

    this.bins.push(new Square());
    this.bins.push(new Circle());
    for (var i=0; i<this.bins.length; i++) {
      this.bins[i].updateProp(2*TARGETSIZE, 'blue', binPositions[i]);
    }

    this.score = 0;
    this.lastMessage = ''
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
    //console.log(results);
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
      if (Math.random()>.5) {
        this.targets.push(new Circle());
      } else {
        this.targets.push(new Square());
      }
    }
    //console.log(results);
    this.updateTargets(getHandAverage(results.multiHandLandmarks, results.multiHandedness));
  }

  scaleAveragePoints(averagePoints) {
      for (const [hand, pos] of Object.entries(averagePoints)) {
        averagePoints[hand].x *= videoWidth;
        averagePoints[hand].y *= videoHeight;
      }
  }

  // return tuple: isNearBin, isItCorrect
  getMatchedBin(target,ctx){
    for (var k=0; k < this.bins.length; k++) {
      console.log(this.bins[k].matches(target));
      console.log(getDistance(target.pos, this.bins[k].pos));
      if (getDistance(target.pos, this.bins[k].pos) <= 40) {
        if (this.bins[k].matches(target)) {
          console.log("MATCHED");
          this.lastMessage = "RIGHT";
          return [true, true];
        } else {
            this.lastMessage = "WRONG"
            return [true, false];
        }
      }
    }
    this.lastMessage = "";
    return [false,false];
  }

  updateTargets(averagePoints) {
    //console.log(averagePoints);
    this.scaleAveragePoints(averagePoints);
    for (var i=0; i < this.targets.length; i++) {
      if (this.targets[i].state == TOUCHED) {
        let followingHand = this.targets[i].followingHand;
          if (followingHand in averagePoints) {
              if (getDistance(this.targets[i].pos, averagePoints[followingHand]) > 70) {
                //hand moved too fast and left target behind
                this.targets[i] = null;
                console.log("Oops dropped");
                this.lastMessage = "DROPPED";
                this.targets = this.targets.splice(i, 0);
              } else {
                  console.log("dragging");
                  this.targets[i].updatePosition(averagePoints[followingHand]);
                  let matches = this.getMatchedBin(this.targets[i], this.ctx);
                  if (matches[0]) {
                    if (matches[1]) {
                      console.log("Binned");
                      this.lastMessage = "RIGHT";
                    } else {
                      this.lastMessage = "WRONG";
                    }
                    this.targets[i] = null;
                    this.targets = this.targets.splice(i, 0);
                  } else {
                    this.lastMessage = "";
                  }
              }
          } else {
            // the hand that was dragging is not in frame anymore
            console.log("LOST HAND");
            this.targets[i] = null;
            this.targets = this.targets.splice(i, 0);
          }
      } else if (this.targets[i].state == NOOB) {
          for (const [hand, pos] of Object.entries(averagePoints)) {
            if (getDistance(this.targets[i].pos, pos) <= 50) {
              console.log("Touched from NOOB");
              //console.log(averagePoints);
              //console.log(pos);
              this.targets[i].touch(hand);
              this.targets[i].updatePosition(pos);
              break;
            }
          }
      }
    }
    for (var i=0; i < this.targets.length; i++) {
      if (this.targets[i].frames > 50 && this.targets[i].state == NOOB) {
        this.targets[i] = null;
        this.targets = this.targets.splice(i, 0);
      } else {
        this.targets[i].drawPosition(this.ctx);
      }
    }
    for(i=0; i < this.bins.length; i++) {
      this.bins[i].drawPosition(this.ctx);
    }
    this.ctx.font = "30px Arial";
    this.ctx.fillText(this.lastMessage,10,50);
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
