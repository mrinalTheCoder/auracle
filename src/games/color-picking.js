import Webcam from 'react-webcam';
import {getDistance, shuffle, EndScreen} from './util.js';
import {PickingTarget, Midpoint} from './base-classes.js';
import {TARGETSIZE, BINSOUND, WRONGBINSOUND} from './constants.js';
import {videoWidth, videoHeight} from './constants.js';
import AIProvider from './ai-provider.js';
import {HeaderBar} from '../components.js';
import React from 'react';

const optionPositions = [
  {x: TARGETSIZE, y: TARGETSIZE},
  {x: TARGETSIZE, y: videoHeight/2},
  {x: TARGETSIZE, y: videoHeight - TARGETSIZE}
];
const optionColors = ['yellow', 'blue', 'black', 'red', 'green', 'orange', 'pink', 'grey', 'purple'];
const targetPosition = {x: videoWidth - TARGETSIZE, y: videoHeight/2};

class Circle extends PickingTarget {
  constructor(x, y, color, size=TARGETSIZE) {
    super(x, y, 'Circle', size);
    this.midpoint = new Midpoint();
    this.color = color;
  }

  drawPosition(ctx) {
    super.drawPosition(ctx);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size/2, 0, 2 * Math.PI, this.color);
    ctx.closePath();
    ctx.fill();
    // this.midpoint.drawPosition(ctx, this.pos);
  }
}

class ColorPicking extends React.Component {
  constructor(props) {
    super(props);

    this.state = {score: 0, total: 0};
    this.handPoint = {};
    this.target = null;
    this.options = [];
    this.frameCount = 0;
    this.isResetting = false;

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

    this.canvasRef.width = videoWidth;
    this.canvasRef.height = videoHeight;
    this.canvasElement = this.canvasRef;
    this.ctx = this.canvasElement.getContext('2d');
    this.ctx.translate(videoWidth, 0);
    this.ctx.scale(-1, 1);

    this.aiProvider = new AIProvider(this.onHandResults, this.webcamRef, this.ctx);
  }

  onHandResults(averagePoints) {
    if (this.frameCount === 40) {
      this.frameCount = 0;
      this.isResetting = false;
    }
    if (this.isResetting) {
      this.frameCount += 1;
      return;
    }

    if (this.target === null) {
      const randomColors = shuffle(optionColors).slice(-3);
      for (let i=0; i<optionPositions.length; i++) {
        this.options.push(new Circle(optionPositions[i].x, optionPositions[i].y, randomColors[i]));
      }
      let toss = Math.floor(Math.random()*3);
      this.target = new Circle(targetPosition.x, targetPosition.y, randomColors[toss]);
    }

    this.target.drawPosition(this.ctx);
    for (let i=0; i<this.options.length; i++) {
      this.options[i].drawPosition(this.ctx);
      for (const temp of Object.entries(averagePoints)) {
        const pos = temp[1];
        if (getDistance(pos, this.options[i].pos) <= 60) {
          if (this.options[i].matches(this.target, 'color')) {
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

  render() {
    return (
      <>
        <HeaderBar title="Color Picking" />
        <div className="App">
          {(this.state.total < 10) ? (
            <>
              <h1>Match the colors by touching</h1>
              <p>Score: {this.state.score} out of {this.state.total}</p>
              <Webcam id='webcam' style={{display:'none'}} />
              <canvas id='canvas' style={this.displayStyle} ></canvas>
            </>
          ) : (<EndScreen type='colorPicking' score={this.state.score} total={this.state.total} />)}
        </div>
      </>
    );
  }
}

export default ColorPicking;
