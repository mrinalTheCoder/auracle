import {NOOB, ROLE_TARGET, BINNED, TOUCHED} from './constants.js';

export class Target {
  constructor(x, y, shape, size) {
    this.pos = {x: x, y: y};
    this.size = size;
    this.shape = shape;
    this.frames = 0;
    this.color = 'yellow';
    this.touchedFrames = 0;
    this.followingHand = '';
    this.state = NOOB;
    this.role = ROLE_TARGET;
  }

  updateProp(size, color, pos, role) {
    this.size = size;
    this.color = color;
    this.updatePosition(pos);
    this.role = role;
  }

  binned() {
    this.state = BINNED;
  }

  updatePosition(pos) {
    this.pos = pos
  }

  drawPosition(ctx) {
    this.frames += 1;
    if (this.state === TOUCHED) {
      this.touchedFrames += 1;
    }
  }

  matches(target, criteria) {
    return(this[criteria] === target[criteria]);
  }
}
