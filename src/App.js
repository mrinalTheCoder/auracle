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
const BINSIZE = TARGETSIZE;

const TIMEOUT_FRAMES = 80;

const NOOB = 1;
const TOUCHED = 2;
const BINNED = 3;
const DROPPED = 4;
const TIMEDOUT = 5;

const TOUCHSOUND = '';
const BINSOUND ='./ding.mp3';
const WRONGBINSOUND ='./cough.mp3';
const DROPPEDSOUND ='./glass_crash_sound.mp3';
const LOSTHANDSOUND ='./losthand.mp3';

const binPositions=[{x:BINSIZE, y:BINSIZE/2 + 100},
  {x:BINSIZE*5, y:BINSIZE/2 +100 },
  {x:BINSIZE*10, y:BINSIZE/2 +100}

];

const ROLE_BIN = 'Bin';
const ROLE_TARGET = 'Target';


class Target {
  constructor(shape,size) {
    this.pos = {
      x: randomNumber(BINSIZE +20 , videoWidth-100),
      y: randomNumber(BINSIZE/2+100, videoHeight-100),
    };
    this.size = size;
    this.shape = shape;
    this.frames = 0;
    this.color = 'yellow';
    //this.touched = false;
    this.touchedFrames = 0;
    this.followingHand = '';
    this.state = NOOB;
    this.role = 'Target';
  }

  updateProp(size, color, pos, role) {
    this.size = size;
    this.color = color;
    this.updatePosition(pos);
    this.role = role;
  }

  touch(hand) {
    this.state = TOUCHED;
    this.color = 'black';
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
    // if (this.frames > 25 && this.state != TOUCHED && this.role != ROLE_BIN) {
    //   this.size *= Math.exp(-.001*(this.frames - 25));
    // }
    if (this.state == TOUCHED) {
      this.touchedFrames += 1;
    }
  }

  playSound() {

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
    //console.log(this.color);
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
    ctx.fillRect(this.pos.x + this.size/2, this.pos.y - this.size/2, this.size, this.size);
    //ctx.closePath();
    //ctx.fill();
  }
}

class Triangle extends Target {
  constructor(size=TARGETSIZE) {
    super('Triangle', size);
  }

  drawPosition(ctx) {
    super.drawPosition(ctx);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.pos.x  - this.size/3, this.pos.y+40);
    ctx.lineTo(this.pos.x + this.size, this.pos.y+40);
    ctx.lineTo(this.pos.x  + this.size , this.pos.y - this.size+40);
    ctx.fill();

    //ctx.beginPath();
    //ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size);
    //ctx.closePath();
    //ctx.fill();
  }
}


const calibrationFrameLimit = 100;
const CALIBRATION = 1;
const GAMEPLAY = 2;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.calibrationPoints = [];
    this.calibrationPoints['Left'] = [];
    this.calibrationPoints['Right'] = [];


    this.calibrationFrames = 0;
    this.calibrated = false;
    this.calibratedSpeed = -1;
    this.phase = CALIBRATION;



    this.calibStartObject = new Circle();
    let foo = this.calibStartObject;
    console.log({ foo });

    this.calibEndObject = new Circle();

    this.calibEndObject.updatePosition({x:150, y:150});

    this.calibStartObject.updatePosition({x:videoWidth - 150, y:videoHeight - 200});



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
        this.targets.push(new Circle());
      } else if (toss > .33){
        this.targets.push(new Square());
      } else {
        this.targets.push(new Triangle());
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

  // calibrateHandMovement(averagePoints) {
  //   console.log(averagePoints);
  //
  //   if (this.calibrationFrames >= calibrationFrameLimit) {
  //     let foo = this.calibrationPoints;
  //     console.log({ foo });
  //     let avgSpeed = getDistance(this.calibrationPoints['Left'][this.calibrationPoints['Left'].length -1],
  //       this.calibrationPoints['Left'][0])/this.calibrationFrames;
  //     console.log("Calibrated speed");
  //     console.log({ avgSpeed });
  //     this.lastMessage = avgSpeed.toString();
  //     return [true, avgSpeed];
  //   }
  //   this.calibrationFrames += 1;
  //   for (const [key, value] of Object.entries(averagePoints))  {
  //     this.calibrationPoints[key].push(value);
  //     //console.log(averagePoints[hand].x, averagePoints.y);
  //   }
  //   return [false, -1];
  // }


  // calibrateHandMovement(averagePoints) {
  //   console.log(averagePoints);
  //
  //   if (this.calibrationFrames >= calibrationFrameLimit) {
  //     let foo = this.calibrationPoints;
  //     console.log({ foo });
  //     let avgSpeed = getDistance(this.calibrationPoints['Left'][this.calibrationPoints['Left'].length -1],
  //       this.calibrationPoints['Left'][0])/this.calibrationFrames;
  //     console.log("Calibrated speed");
  //     console.log({ avgSpeed });
  //     this.lastMessage = avgSpeed.toString();
  //     return [true, avgSpeed];
  //   }
  //   this.calibrationFrames += 1;
  //   for (const [key, value] of Object.entries(averagePoints))  {
  //     this.calibrationPoints[key].push(value);
  //     //console.log(averagePoints[hand].x, averagePoints.y);
  //   }
  //   return [false, -1];
  // }

  updateTargets(averagePoints) {
    //console.log(averagePoints);
    this.scaleAveragePoints(averagePoints);



    if (this.phase == CALIBRATION) {
      this.calibStartObject.drawPosition(this.ctx);
      this.calibEndObject.drawPosition(this.ctx);
      if (this.calibStartObject.state == NOOB) {
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

    // if (!this.calibrated) {
    //    let values = this.calibrateHandMovement(averagePoints);
    //    if(values[0]) {
    //      this.calibrated = true;
    //      this.calibratedSpeed = values[1];
    //    }
    //    return;
    // }
    for (var i=0; i < this.targets.length; i++) {
      if (this.targets[i].state == TOUCHED) {
        let followingHand = this.targets[i].followingHand;
          if (followingHand in averagePoints) {
              if (getDistance(this.targets[i].pos, averagePoints[followingHand]) > 100) {
                //hand moved too fast and left target behind
                this.targets[i] = null;
                console.log("Oops dropped");
                //this.lastMessage = "DROPPED";
                var audio = new Audio(DROPPEDSOUND);
                audio.play();
                this.targets = this.targets.splice(i, 0);
              } else {
                  console.log("dragging");
                  this.targets[i].updatePosition(averagePoints[followingHand]);
                  let matches = this.getMatchedBin(this.targets[i], this.ctx);
                  if (matches[0]) {
                    if (matches[1]) {
                      console.log("Binned");
                      //this.lastMessage = "RIGHT";
                      var audio = new Audio(BINSOUND);
                      audio.play();
                    } else {
                      //this.lastMessage = "WRONG";
                      var audio = new Audio(WRONGBINSOUND);
                      audio.play();
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
      } else if (this.targets[i].state == NOOB) {
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
    for (var i=0; i < this.targets.length; i++) {
      if (this.targets[i].frames > TIMEOUT_FRAMES && this.targets[i].state == NOOB) {
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

export default App;
