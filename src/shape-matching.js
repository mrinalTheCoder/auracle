import {Hands} from '@mediapipe/hands';
import {HAND_CONNECTIONS} from '@mediapipe/hands';
import {SelfieSegmentation} from '@mediapipe/selfie_segmentation';
import Webcam from 'react-webcam';
import * as cam from '@mediapipe/camera_utils';
import {getHandAverage, getDistance} from './util.js';
import {Target, Midpoint} from './util.js';
import {TARGETSIZE, NOOB, TOUCHED, ROLE_BIN} from './constants.js';
import {DROPPEDSOUND, BINSOUND, WRONGBINSOUND, LOSTHANDSOUND, TIMEOUT_FRAMES} from './constants.js';
import {videoWidth, videoHeight} from './constants.js';
import React from 'react';

const BINSIZE = TARGETSIZE;
const binPositions=[
  {x:BINSIZE, y:BINSIZE/2 + 100},
  {x:BINSIZE*5, y:BINSIZE/2 +100 },
  {x:BINSIZE*10, y:BINSIZE/2 +100}
];

class Circle extends Target {
  constructor(size=TARGETSIZE) {
    super('Circle', size);
    this.midpoint = new Midpoint();
  }

  touch(hand) {
    this.state = TOUCHED;
    this.color = 'black';
    this.followingHand = hand;
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

class Square extends Target {
  constructor(size=TARGETSIZE) {
    super('Square', size);
    this.midpoint = new Midpoint();
    this.midpoint.color= 'grey';
  }

  touch(hand) {
    this.state = TOUCHED;
    this.color = 'black';
    this.followingHand = hand;
  }

  drawPosition(ctx) {
    super.drawPosition(ctx);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.pos.x- this.size/2, this.pos.y -this.size/2, this.size, this.size);
    this.midpoint.drawPosition(ctx, this.pos);

  }
}

class Triangle extends Target {
  constructor(size=TARGETSIZE) {
    super('Triangle', 2*size/Math.sqrt(3));
    this.midpoint = new Midpoint();
    this.midpoint.color= 'grey';
  }

  touch(hand) {
    this.state = TOUCHED;
    this.color = 'black';
    this.followingHand = hand;
  }

  drawPosition(ctx) {
    super.drawPosition(ctx);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.pos.x  - this.size/2, this.pos.y+this.size/(2*Math.sqrt(3)));
    ctx.lineTo(this.pos.x + this.size/2, this.pos.y+ this.size/(2*Math.sqrt(3)));
    ctx.lineTo(this.pos.x, this.pos.y - this.size/(Math.sqrt(3)));
    ctx.fill();
    this.midpoint.drawPosition(ctx, this.pos);
  }

  updateProp(size, color, pos, role) {
    this.size = size*2/Math.sqrt(3);
    this.color = color;
    this.updatePosition(pos);
    this.role = role;
  }
}

class ShapeMatching extends React.Component {
  constructor(props) {
    super(props);

    this.handPoint = {};
    this.targets = [];
    this.bins = [];

    this.bins.push(new Circle());
    this.bins.push(new Triangle());
    this.bins.push(new Square());

    for (var i=0; i<this.bins.length; i++) {
      this.bins[i].updateProp(TARGETSIZE, 'blue', binPositions[i], ROLE_BIN);
    }

    this.score = 0;
    this.lastMessage = ''
    this.onHandResults = this.onHandResults.bind(this);
    this.onSegmentationResults = this.onSegmentationResults.bind(this);
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

  onHandResults(results) {
    const averagePoints = getHandAverage(results.multiHandLandmarks, results.multiHandedness);
    this.ctx.save();
    // this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    // this.ctx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
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
    if (this.targets.length === 0) {
      let toss = Math.random();
      //this.targets.push(new Triangle());
      if (toss >.66) {
        this.targets.push(new Circle());
      } else if (toss > .33){
        this.targets.push(new Square());
      } else {
        this.targets.push(new Triangle());
      }
    }
    //console.log(results);
    this.updateTargets(averagePoints);
  }

  scaleAveragePoints(averagePoints) {
      for (const hand of Object.keys(averagePoints)) {
        averagePoints[hand].x *= videoWidth;
        averagePoints[hand].y *= videoHeight;
      }
  }

  // return tuple: isNearBin, isItCorrect
  getMatchedBin(target,ctx){
    for (var k=0; k < this.bins.length; k++) {
      if (getDistance(target.pos, this.bins[k].pos) <= 40) {
        if (this.bins[k].matches(target)) {
          console.log("MATCHED");
          //this.lastMessage = "RIGHT";
          return [true, true];
        } else {
            //this.lastMessage = "WRONG"
            return [true, false];
        }
      }
    }
    //this.lastMessage = "";
    return [false,false];
  }


  updateTargets(averagePoints) {
    this.scaleAveragePoints(averagePoints);

    for (let i=0; i < this.targets.length; i++) {
      if (this.targets[i].state === TOUCHED) {
        let followingHand = this.targets[i].followingHand;
          if (followingHand in averagePoints) {
              if (getDistance(this.targets[i].pos, averagePoints[followingHand]) > 100) {
                //hand moved too fast and left target behind
                this.targets[i] = null;
                console.log("Oops dropped");
                //this.lastMessage = "DROPPED";
                var droppedAudio = new Audio(DROPPEDSOUND);
                droppedAudio.play();
                this.targets = this.targets.splice(i, 0);
              } else {
                  console.log("dragging");
                  this.targets[i].updatePosition(averagePoints[followingHand]);
                  let matches = this.getMatchedBin(this.targets[i], this.ctx);
                  if (matches[0]) {
                    if (matches[1]) {
                      console.log("Binned");
                      //this.lastMessage = "RIGHT";
                      var binAudio = new Audio(BINSOUND);
                      binAudio.play();
                    } else {
                      //this.lastMessage = "WRONG";
                      var wrongBinAudio = new Audio(WRONGBINSOUND);
                      wrongBinAudio.play();
                    }
                    this.targets[i] = null;
                    this.targets = this.targets.splice(i, 0);
                  } else {
                    //this.lastMessage = "";
                  }
              }
          } else {
            // the hand that was dragging is not in frame anymore
            console.log("LOST HAND");
            var audio = new Audio(LOSTHANDSOUND);
            audio.play();
            this.targets[i] = null;
            this.targets = this.targets.splice(i, 0);
          }
      } else if (this.targets[i].state === NOOB) {
          for (const [hand, pos] of Object.entries(averagePoints)) {
            if (getDistance(this.targets[i].pos, pos) <= 60) {
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
    for (let i=0; i < this.targets.length; i++) {
      if (this.targets[i].frames > TIMEOUT_FRAMES && this.targets[i].state === NOOB) {
        this.targets[i] = null;
        this.targets = this.targets.splice(i, 0);
      } else {
        this.targets[i].drawPosition(this.ctx);
      }
    }
    //Draw handpoint midpoints
    console.log(this.handPoint);
    for (const [hand, pos] of Object.entries(averagePoints)) {
      console.log(hand);
      this.handPoint[hand].drawPosition(this.ctx, pos);
    }

    //Draw bins
    for(let i=0; i < this.bins.length; i++) {
      this.bins[i].drawPosition(this.ctx);
    }
    this.ctx.font = "30px Arial";
    this.ctx.fillText(this.lastMessage,videoHeight -100,50);
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

export default ShapeMatching;
