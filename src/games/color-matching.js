import Webcam from 'react-webcam';
import {getDistance, SelectMode, EndScreen} from './util.js';
import {MatchingTarget, Midpoint} from './base-classes.js'
import {TARGETSIZE, NOOB, TOUCHED, ROLE_BIN} from './constants.js';
import {DROPPEDSOUND, BINSOUND, WRONGBINSOUND, TIMEOUT_FRAMES} from './constants.js';
import confetti from 'canvas-confetti';
import {videoWidth, videoHeight} from './constants.js';
import {HeaderBar} from '../components.js';
import AIProvider from './ai-provider.js';
import Box from '@mui/material/Box';
import React from 'react';

const BINSIZE = TARGETSIZE;
const binPositions = [
  {x:BINSIZE, y:BINSIZE/2 + 100},
  {x:BINSIZE*4, y:BINSIZE/2 + 100},
  {x:BINSIZE*7, y:BINSIZE/2 +100}
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
    super.drawPosition();
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
    if (window.location.search === '') {
      window.location = '/color-matching?mode=avg';
    }

    this.state = {total: 0, score: 0};
    this.targets = [];
    this.bins = [];

    this.bins.push(new Circle('green'));
    this.bins.push(new Circle('blue'));
    this.bins.push(new Circle('red'));

    for (var i=0; i<this.bins.length; i++) {
      this.bins[i].updateProp(TARGETSIZE, this.bins[i].color, binPositions[i], ROLE_BIN);
    }

    this.score = 0;
    this.lastMessage = '';
    this.displayStyle = {
      position: 'absolute',
      marginRight: 'auto',
      marginLeft: 'auto',
      left: 0, right: 0,
      textAlign: 'center',
      width: videoWidth, height: videoHeight
    };
    this.start = new Date();

    this.onHandResults = this.onHandResults.bind(this);
    this.updateTargets = this.updateTargets.bind(this);
  }

  componentDidMount() {
    this.webcamRef = document.getElementById('webcam');
    this.canvasRef = document.getElementById('canvas');

    this.canvasRef.width = videoWidth;
    this.canvasRef.height = videoHeight;
    this.canvasElement = this.canvasRef;
    this.ctx = this.canvasElement.getContext('2d');
    this.ctx.translate(videoWidth, 0);
    this.ctx.scale(-1, 1);

    this.aiProvider = new AIProvider(
      this.onHandResults,
      this.webcamRef,
      this.ctx,
      window.location.search.substring(6)
    );
  }

  onHandResults(averagePoints) {
    if (this.targets.length === 0) {
      let toss = Math.random();
      if (toss >.66) {
        this.targets.push(new Circle('green'));
      } else if (toss > .33){
        this.targets.push(new Circle('blue'));
      } else {
        this.targets.push(new Circle('red'));
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
              if (getDistance(this.targets[i].pos, averagePoints[followingHand]) > 200) {
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
                      confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.7 }
                      });
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
            var audio = new Audio(DROPPEDSOUND);
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
      <>
        <HeaderBar
          title="Color Matching: Match the colors by dragging"
          secondaryText={`Score: ${this.state.score} out of ${this.state.total}`}
        />
        <Box>
        {(this.state.total < 10) ? (
          <>
            <Webcam id='webcam' style={{display:'none'}} />
            <canvas id='canvas' style={this.displayStyle} ></canvas>
            <SelectMode game='color-matching' />
          </>
        ) : (
          <EndScreen
            type='colorMatching'
            score={this.state.score}
            total={this.state.total}
            start={this.start}
          />
        )}
        </Box>
      </>
    );
  }
}

export default ColorMatching;
