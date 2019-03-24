import { convertHexToRgb } from './util';

const RULERS_NUMBER = 5;
const ANIMATION_DURATION = 20;

export default class RulerRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animationId = null;
    this.animationIteration = 0;
    this.stepY = 1 / RULERS_NUMBER * this.canvas.height;
    this.roundedMax = 0;
    this.values = [];
    this.rulers = [];
  }

  render(snapshot) {
    const { max } = snapshot;

    if (max === null) {
      this.reset()
      return;
    }

    const roundingFactor = 10 ** (Math.floor(Math.log10(max)) - 1);
    const roundedMax = Math.round(max/roundingFactor) * roundingFactor;

    if (roundedMax === this.roundedMax) return;

    const step = roundedMax/RULERS_NUMBER;
    const diff = roundedMax - this.roundedMax;
    const direction = diff/Math.abs(diff);
    this.roundedMax = roundedMax;
    const values = [];

    for (let i=RULERS_NUMBER; i > -1; i--) {
      values.push(Math.round(step * i));
    }

    this.reset();
    this.animate(values, direction);
  }

  animate(values, direction) {
    this.animationIteration++;

    let newRulers;
    let oldRulers;

    if (direction > 0) {
      newRulers = values.map((value,index) => ({
        value,
        y: this.animationIteration/ANIMATION_DURATION * this.stepY * index,
        opacity: this.animationIteration/ANIMATION_DURATION * index
      }));
      oldRulers = this.values.map((value,index) => ({
        value,
        y: this.stepY * index + this.animationIteration/ANIMATION_DURATION * this.stepY * index,
        opacity: 1 - this.animationIteration/ANIMATION_DURATION * index
      }));
    } else {
      newRulers = [...values].reverse().map((value,index) => ({
        value,
        y: this.canvas.height - this.animationIteration/ANIMATION_DURATION * this.stepY * index,
        opacity: this.animationIteration/ANIMATION_DURATION * index
      }));
      oldRulers = [...this.values].reverse().map((value,index) => ({
        value,
        y: this.canvas.height - this.stepY * index - this.animationIteration/ANIMATION_DURATION * this.stepY * index,
        opacity: 1 - this.animationIteration/ANIMATION_DURATION * index
      }));
    }

    this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    this.renderRulers(newRulers);
    this.renderRulers(oldRulers);

    if (this.animationIteration < ANIMATION_DURATION) {
      this.animationId = requestAnimationFrame(() => {
        this.animate(values, direction);
      });
    } else {
      this.animationIteration = 0;
      this.values = values;
      this.rulers = newRulers;
    }
  }

  renderRulers(rulers) {
    this.ctx.beginPath();

    rulers.forEach(({value, y, opacity}) => {
      const style = convertHexToRgb(this.colors.secondary, opacity);
      this.ctx.strokeStyle = style;
      this.ctx.fillStyle = style;
      this.ctx.lineWidth = 0.1;
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.font = '100 normal 10px arial';
      this.ctx.fillText(value.toString(), 2, y-2);
    });

    this.ctx.stroke();
  }

  reset() {
    this.rulers = [];
    this.animationIteration = 0;
    cancelAnimationFrame(this.animationId);
    this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
  }

  setColors(colors) {
    this.colors = colors;

    this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    this.renderRulers(this.rulers);
  }
}