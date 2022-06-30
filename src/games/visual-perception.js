import Webcam from 'react-webcam';
import {getDistance, shuffle, SelectMode, EndScreen} from './util.js';
import {PickingTarget, Midpoint} from './base-classes.js';
import {TARGETSIZE, BINSOUND, WRONGBINSOUND, RESETTING_FRAMES} from './constants.js';
import confetti from 'canvas-confetti';
import {videoWidth, videoHeight} from './constants.js';
import AIProvider from './ai-provider.js';
import {HeaderBar} from '../components.js';
import Box from '@mui/material/Box';
import React from 'react';

const optionPositions = [
  {x: TARGETSIZE, y: videoHeight/4 + TARGETSIZE/2},
  {x: TARGETSIZE, y: 3*videoHeight/4 + TARGETSIZE/2},
];
const optionTexts = [['p', 'b'], ['q', 'd'], ['p', 'q'], ['b', 'd'], ['6', '9']];
const targetPosition = {x: -videoWidth+(2*TARGETSIZE), y: videoHeight/2 + TARGETSIZE/2};

let cueVoice = new SpeechSynthesisUtterance();
const voices = window.speechSynthesis.getVoices();
cueVoice.voice = voices.filter(function(voice) { return voice.name === 'Fiona'; })[0];;
cueVoice.rate = 0.7;

class Text extends PickingTarget {
  constructor(x, y, text, size=TARGETSIZE) {
    super(x, y, size);
    this.midpoint = new Midpoint();
    this.text = text;
  }

  drawPosition(ctx) {
    super.drawPosition();
    ctx.font = '100px Comic Sans MS';
    ctx.fillStyle = 'blue';
    ctx.textAlign = 'right';
    ctx.save();
    ctx.translate(videoWidth, 0);
    ctx.scale(-1, 1);
    ctx.translate(videoWidth-TARGETSIZE, 0);
    ctx.fillText(this.text, this.pos.x, this.pos.y);
    ctx.restore();
  }
}

class VisualPerception extends React.Component {
  constructor(props) {
    super(props);
    if (window.location.search === '') {
      window.location = '/visual-perception?mode=avg';
    }

    this.state = {score: [], total: 0};
    this.handPoint = {};
    this.target = null;
    this.options = [];
    this.frameCount = 0;
    this.isResetting = false;
    this.displayStyle = {
      position: 'absolute',
      marginRight: 'auto',
      marginLeft: 'auto',
      left: 0, right: 0,
      textAlign: 'center',
      width: videoWidth, height: videoHeight
    };

    this.times = [new Date()];
    this.onHandResults = this.onHandResults.bind(this);
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
    if (this.frameCount === RESETTING_FRAMES) {
      this.frameCount = 0;
      this.isResetting = false;
    }
    if (this.isResetting) {
      this.frameCount += 1;
      return;
    }

    if (this.target === null) {
      let randomTexts = shuffle(optionTexts)[optionTexts.length - 1];
      for (let i=0; i<optionPositions.length; i++) {
        this.options.push(new Text(optionPositions[i].x, optionPositions[i].y, randomTexts[i]));
      }
      let toss = Math.floor(Math.random()*2);
		  if (this.state.total === 0) {
        cueVoice.text = "Move your hand to the matching letter or number";
        window.speechSynthesis.speak(cueVoice);
      }
      this.target = new Text(targetPosition.x, targetPosition.y, randomTexts[toss]);
    }

    this.target.drawPosition(this.ctx);
    for (let i=0; i<this.options.length; i++) {
      this.options[i].drawPosition(this.ctx);
      for (const temp of Object.entries(averagePoints)) {
        const pos = temp[1];
        if (getDistance(pos, this.options[i].pos) <= 60) {
		      this.times.push(new Date());
          if (this.options[i].matches(this.target, 'text')) {
            this.setState({score: [...this.state.score, 1]});
            var binAudio = new Audio(BINSOUND);
            binAudio.play();
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.7 }
            });
          } else {
			      this.setState({score: [...this.state.score, 0]});
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

  render() {
    return (
      <>
        <HeaderBar
          title="Visual Perception: Touch the matching the letter/number"
          secondaryText={`Score: ${this.state.score.reduce((sum, a) => sum+a, 0)} out of ${this.state.total}`}
        />
        <Box>
          {(this.state.total < 10) ? (
            <>
              <Webcam id='webcam' style={{display:'none'}} mirrored={true} />
              <canvas id='canvas' style={this.displayStyle} ></canvas>
              <SelectMode game='visual-perception' />
            </>
          ) : (
            <EndScreen
              type='visualPerception'
              score={this.state.score}
              total={this.state.total}
              times={this.times}
            />
          )}
        </Box>
      </>
    );
  }
}

export default VisualPerception;
