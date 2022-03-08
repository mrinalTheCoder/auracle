import Webcam from 'react-webcam';
import {getDistance, shuffle, EndScreen} from './util.js';
import {PickingTarget, Midpoint} from './base-classes.js';
import {TARGETSIZE, BINSOUND, WRONGBINSOUND} from './constants.js';
import {videoWidth, videoHeight} from './constants.js';
import {HeaderBar} from '../components.js';
import AIProvider from './ai-provider.js';
import React from 'react';

const optionPositions = [
  {x: TARGETSIZE, y: TARGETSIZE},
  {x: TARGETSIZE, y: videoHeight/2},
  {x: TARGETSIZE, y: videoHeight - TARGETSIZE}
];
const optionShapes = ['Circle', 'Triangle', 'Square', 'Star', 'Diamond'];
const targetPosition = {x: videoWidth - TARGETSIZE, y: videoHeight/2};

class Shape extends PickingTarget {
  constructor(x, y, shape, color) {
    super(x, y, shape, TARGETSIZE);
    this.midpoint = new Midpoint();
    this.color = color;
  }

  drawPosition(ctx) {
    super.drawPosition(ctx);
    ctx.fillStyle = this.color;
    if (this.shape === 'Circle') {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.size/2, 0, 2 * Math.PI, this.color);
      ctx.closePath();
      ctx.fill();
    } else if (this.shape === 'Square') {
      ctx.fillRect(this.pos.x- this.size/2, this.pos.y -this.size/2, this.size, this.size);
    } else if (this.shape === 'Triangle') {
      ctx.beginPath();
      ctx.moveTo(this.pos.x  - this.size/2, this.pos.y+this.size/(2*Math.sqrt(3)));
      ctx.lineTo(this.pos.x + this.size/2, this.pos.y+ this.size/(2*Math.sqrt(3)));
      ctx.lineTo(this.pos.x, this.pos.y - this.size/(Math.sqrt(3)));
      ctx.fill();
    } else if (this.shape === 'Star') {
      let rot = Math.PI / 2 * 3;
      let step = Math.PI / 5;
      let x = this.pos.x;
      let y = this.pos.y;
      ctx.beginPath();
      ctx.moveTo(this.pos.x, this.pos.y - this.size/2)
      for (let i=0; i<5; i++) {
        x = this.pos.x + Math.cos(rot) * this.size/2;
        y = this.pos.y + Math.sin(rot) * this.size/2;
        ctx.lineTo(x, y)
        rot += step
        x = this.pos.x + Math.cos(rot) * this.size/4;
        y = this.pos.y + Math.sin(rot) * this.size/4;
        ctx.lineTo(x, y)
        rot += step
      }
      ctx.lineTo(this.pos.x, this.pos.y - this.size/2)
      ctx.closePath();
      ctx.fill();
    } else if (this.shape === 'Diamond') {
      ctx.beginPath();
      ctx.moveTo(this.pos.x, this.pos.y);
      ctx.lineTo(this.pos.x+this.size/2, this.pos.y+this.size/2);
      ctx.lineTo(this.pos.x, this.pos.y+this.size);
      ctx.lineTo(this.pos.x-this.size/2, this.pos.y+this.size/2);
      ctx.closePath();
      ctx.fill();
    }
    this.midpoint.drawPosition(ctx, this.pos);
  }
}

class ShapePicking extends React.Component {
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
    console.log(averagePoints);
    if (this.frameCount === 40) {
      this.frameCount = 0;
      this.isResetting = false;
    }
    if (this.isResetting) {
      this.frameCount += 1;
      return;
    }

    if (this.target === null) {
      const randomShapes = shuffle(optionShapes).slice(-3);
      for (let i=0; i<optionPositions.length; i++) {
        this.options.push(new Shape(optionPositions[i].x, optionPositions[i].y, randomShapes[i], 'darkorange'));
      }
      let toss = Math.floor(Math.random()*3);
      this.target = new Shape(targetPosition.x, targetPosition.y, randomShapes[toss], 'blue');
    }

    this.target.drawPosition(this.ctx);
    for (let i=0; i<this.options.length; i++) {
      this.options[i].drawPosition(this.ctx);
      for (const temp of Object.entries(averagePoints)) {
        const pos = temp[1];
        if (getDistance(pos, this.options[i].pos) <= 60) {
          if (this.options[i].matches(this.target, 'shape')) {
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
        <HeaderBar
          title="Shape Picking: Match the shapes by touching"
          secondaryText={`Score: ${this.state.score} out of ${this.state.total}`}
        />
        <div className="App">
          {(this.state.total < 10) ? (
            <>
              <Webcam id='webcam' style={{display:'none'}} />
              <canvas id='canvas' style={this.displayStyle} ></canvas>
            </>
          ) : (<EndScreen type='shapePicking' score={this.state.score} total={this.state.total} />)}

        </div>
      </>
    );
  }
}

export default ShapePicking;
