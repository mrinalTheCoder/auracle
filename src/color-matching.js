import Webcam from 'react-webcam';
import {getDistance} from './util.js';
import {MatchingTarget, Midpoint} from './base-classes.js'
import {TARGETSIZE, NOOB, TOUCHED, ROLE_BIN} from './constants.js';
import {DROPPEDSOUND, BINSOUND, WRONGBINSOUND, LOSTHANDSOUND, TIMEOUT_FRAMES} from './constants.js';
import {videoWidth, videoHeight} from './constants.js';
import AIProvider from './ai-provider.js';
import React from 'react';

const BINSIZE = TARGETSIZE;
const binPositions = [
  {x:BINSIZE, y:BINSIZE/2 + 100},
  {x:BINSIZE*5, y:BINSIZE/2 + 100},
  {x:BINSIZE*10, y:BINSIZE/2 +100}
];

class Circle extends MatchingTarget {
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

class ColorMatching extends React.Component {
  constructor(props) {
    super(props);

    this.state = {total: 0, score: 0};
    this.targets = [];
    this.bins = [];

    this.bins.push(new Circle('yellow'));
    this.bins.push(new Circle('blue'));
    this.bins.push(new Circle('black'));

    for (var i=0; i<this.bins.length; i++) {
      this.bins[i].updateProp(TARGETSIZE, this.bins[i].color, binPositions[i], ROLE_BIN);
    }

    this.score = 0;
    this.lastMessage = ''
    this.onHandResults = this.onHandResults.bind(this);
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

    this.canvasRef.width = videoWidth;
    this.canvasRef.height = videoHeight;
    this.canvasElement = this.canvasRef;
    this.ctx = this.canvasElement.getContext('2d');
    this.ctx.translate(videoWidth, 0);
    this.ctx.scale(-1, 1);

    this.aiProvider = new AIProvider(this.onHandResults, this.webcamRef, this.ctx);
  }

  onHandResults(averagePoints) {
    if (this.targets.length === 0) {
      let toss = Math.random();
      if (toss >.66) {
        this.targets.push(new Circle('yellow'));
      } else if (toss > .33){
        this.targets.push(new Circle('blue'));
      } else {
        this.targets.push(new Circle('black'));
      }
    }
    this.updateTargets(averagePoints);
  }

  // return tuple: isNearBin, isItCorrect
  getMatchedBin(target,ctx){
    for (var k=0; k < this.bins.length; k++) {
      if (getDistance(target.pos, this.bins[k].pos) <= 40) {
        // if (this.bins[k].matches(target)) {
        if (this.bins[k].color === target.color) {
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
    for (let i=0; i < this.targets.length; i++) {
      if (this.targets[i].state === TOUCHED) {
        let followingHand = this.targets[i].followingHand;
          if (followingHand in averagePoints) {
              if (getDistance(this.targets[i].pos, averagePoints[followingHand]) > 100) {
                //hand moved too fast and left target behind
                this.targets[i] = null;
                //this.lastMessage = "DROPPED";
                var droppedAudio = new Audio(DROPPEDSOUND);
                droppedAudio.play();
                this.setState({total: this.state.total + 1});
                this.targets = this.targets.splice(i, 0);
              } else {
                  this.targets[i].updatePosition(averagePoints[followingHand]);
                  let matches = this.getMatchedBin(this.targets[i], this.ctx);
                  if (matches[0]) {
                    if (matches[1]) {
                      //this.lastMessage = "RIGHT";
                      var binAudio = new Audio(BINSOUND);
                      binAudio.play();
                      this.setState({total: this.state.total + 1});
                      this.setState({score: this.state.score + 1});
                    } else {
                      //this.lastMessage = "WRONG";
                      var wrongBinAudio = new Audio(WRONGBINSOUND);
                      wrongBinAudio.play();
                      this.setState({total: this.state.total + 1});
                    }
                    this.targets[i] = null;
                    this.targets = this.targets.splice(i, 0);
                  } else {
                    //this.lastMessage = "";
                  }
              }
          } else {
            // the hand that was dragging is not in frame anymore
            var audio = new Audio(LOSTHANDSOUND);
            audio.play();
            this.setState({total: this.state.total + 1});
            this.targets[i] = null;
            this.targets = this.targets.splice(i, 0);
          }
      } else if (this.targets[i].state === NOOB) {
          for (const [hand, pos] of Object.entries(averagePoints)) {
            if (getDistance(this.targets[i].pos, pos) <= 60) {
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
      {(this.state.total < 10) ? (
        <>
          <h1>Match the colors by dragging</h1>
          <p>Score: {this.state.score} out of {this.state.total}</p>
          <Webcam id='webcam' style={{display:'none'}} />
          <canvas id='canvas' style={this.displayStyle} ></canvas>
        </>
      ) : (
        <>
          <div style={{margin: 'auto'}}>
            <h1><big>Final Score: {this.state.score}/{this.state.total}</big></h1>
          </div>
        </>
      )}
      </div>
    );
  }
}

export default ColorMatching;
