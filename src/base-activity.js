import {videoWidth, videoHeight} from './constants.js';
import {TARGETSIZE, GAMEPLAY, CALIBRATION, NOOB, TOUCHED, ROLE_BIN} from './constants.js';
import {DROPPEDSOUND, BINSOUND, WRONGBINSOUND, LOSTHANDSOUND, TIMEOUT_FRAMES} from './constants.js';
import {Midpoint} from './util.js';
import {getDistance} from './util.js';
import Webcam from 'react-webcam';
import * as cam from '@mediapipe/camera_utils';
import {Hands} from '@mediapipe/hands';
import React from 'react';

class BaseActivity extends React.Component {
  constructor(props) {
    super(props);

    this.phase = GAMEPLAY;
    this.handPoint = [];
    this.handPoint['Left'] = new Midpoint();
    this.handPoint['Right'] = new Midpoint();

    this.targets = [];
    this.bins = props.bins;
    const BINSIZE = TARGETSIZE;
    this.binPositions = [
      {x:BINSIZE, y:BINSIZE/2 + 100},
      {x:BINSIZE*5, y:BINSIZE/2 +100 },
      {x:BINSIZE*10, y:BINSIZE/2 +100}
    ];
    for (var i=0; i<this.bins.length; i++) {
      this.bins[i].updateProp(TARGETSIZE, 'blue', this.binPositions[i], ROLE_BIN);
    }

    this.score = 0;
    this.lastMessage = '';
    this.onResults = props.onResults;
    this.onResultsWrapper = this.onResultsWrapper.bind(this);
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
    hands.onResults(this.onResultsWrapper);

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

  onResultsWrapper(results) {
    this.onResults(results, this.ctx);
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

export default BaseActivity;
