import {Hands} from '@mediapipe/hands';
import {HAND_CONNECTIONS} from '@mediapipe/hands';
import Webcam from 'react-webcam';
import * as cam from '@mediapipe/camera_utils';
import {getHandAverage, getDistance} from './util.js';
import {Target, Midpoint} from './util.js';
import {TARGETSIZE, GAMEPLAY, CALIBRATION, NOOB, TOUCHED, ROLE_BIN} from './constants.js';
import {DROPPEDSOUND, BINSOUND, WRONGBINSOUND, LOSTHANDSOUND, TIMEOUT_FRAMES} from './constants.js';
import {videoWidth, videoHeight} from './constants.js';
import React from 'react';

const BINSIZE = TARGETSIZE;

const binPositions=[
  {x:BINSIZE, y:BINSIZE/2 + 100},
  {x:BINSIZE*5, y:BINSIZE/2 + 100},
  {x:BINSIZE*10, y:BINSIZE/2 +100}
];

class Circle extends Target {
  constructor(color, size=TARGETSIZE) {
    super('Circle', size);
    this.midpoint = new Midpoint();
    this.color = color;
  }

  touch(hand) {
    this.state = TOUCHED;
    this.followingHand = hand;
    this.size += 20;
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
// const calibrationFrameLimit = 100;

class ColorMatching extends React.Component {
  constructor(props) {
    super(props);

    this.calibrationPoints = [];
    this.calibrationPoints['Left'] = [];
    this.calibrationPoints['Right'] = [];


    this.calibrationFrames = 0;
    this.calibrated = false;
    this.calibratedSpeed = -1;
    this.phase = GAMEPLAY;

    this.calibStartObject = new Circle('blue');
    let foo = this.calibStartObject;
    console.log({ foo });

    this.calibEndObject = new Circle('blue');

    this.calibEndObject.updatePosition({x:150, y:150});

    this.calibStartObject.updatePosition({x:videoWidth - 150, y:videoHeight - 200});

    this.handPoint = [];
    this.handPoint['Left'] = new Midpoint();
    this.handPoint['Right'] = new Midpoint();

    this.targets = [];
    this.bins = [];

    this.bins.push(new Circle('white'));
    this.bins.push(new Circle('blue'));
    this.bins.push(new Circle('black'));

    for (var i=0; i<this.bins.length; i++) {
      this.bins[i].updateProp(TARGETSIZE, this.bins[i].color, binPositions[i], ROLE_BIN);
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
      minTrackingConfidence: 0.2
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
      let toss = Math.random();
      //this.targets.push(new Triangle());
      if (toss >.66) {
        this.targets.push(new Circle('white'));
      } else if (toss > .33){
        this.targets.push(new Circle('blue'));
      } else {
        this.targets.push(new Circle('black'));
      }
    }
    //console.log(results);
    this.updateTargets(getHandAverage(results.multiHandLandmarks, results.multiHandedness));
  }

  scaleAveragePoints(averagePoints) {
      for (const [hand, pos] of Object.entries(averagePoints)) {
        averagePoints[hand].x *= videoWidth;
        averagePoints[hand].y *= videoHeight;
        console.log(pos);
      }
  }

  // return tuple: isNearBin, isItCorrect
  getMatchedBin(target,ctx){
    for (var k=0; k < this.bins.length; k++) {
      //console.log(this.bins[k].matches(target));
      //console.log(getDistance(target.pos, this.bins[k].pos));
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
    //console.log(averagePoints);
    this.scaleAveragePoints(averagePoints);

    if (this.phase === CALIBRATION) {
      this.calibStartObject.drawPosition(this.ctx);
      this.calibEndObject.drawPosition(this.ctx);
      if (this.calibStartObject.state === NOOB) {
        for (const [hand, pos] of Object.entries(averagePoints)) {
          if (getDistance(this.calibStartObject.pos, pos) <= 50) {
            console.log("Start object touched from NOOB");
            //console.log(averagePoints);
            //console.log(pos);
            this.calibrationFrames += 1;
            this.calibStartObject.touch(hand);
            return;
          }
        }
      } else {
        this.calibrationFrames += 1;
        for (const [hand, pos] of Object.entries(averagePoints)) {
          if (getDistance(this.calibEndObject.pos, pos) <= 50) {
            console.log("End object touched from NOOB");
            //console.log(averagePoints);
            //console.log(pos);
            this.calibrationFrames += 1;
            this.calibEndObject.touch(hand);
            this.phase = GAMEPLAY;
            let avgSpeed = getDistance(this.calibEndObject.pos, this.calibStartObject.pos)/this.calibrationFrames;
            console.log("Calibrated speed");
            console.log({ avgSpeed });
            this.lastMessage = avgSpeed.toString();
            this.calibratedSpeed = avgSpeed;
          }
        }
      }
      return;
    }

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
            console.log(followingHand);
            console.log({ averagePoints });
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
    for (const [hand, pos] of Object.entries(averagePoints)) {
      this.handPoint[hand].drawPosition(this.ctx,pos);
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

export default ColorMatching;
