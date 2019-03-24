import { convertHexToRgb } from './util';

const BORDER_WIDTH = 5; // in pixels

export default class RangeSelector {
  constructor(view, minRange) {
    this.view = view;
    this.ctx = this.view.getContext('2d');
    this.minRange = this.view.width * minRange;
    this.leftX = 0;
    this.rightX = this.minRange + BORDER_WIDTH;
  }

  init() {
    this.update();

    this.view.onmouseup = () => {
      this.view.onmousemove = null;
    }

    this.view.onmouseout = () => {
      this.view.onmousemove = null;
    }

    this.view.onmousedown = (e) => {
      if (e.layerX >= this.leftX && e.layerX <= this.leftX + BORDER_WIDTH) {
        this.view.onmousemove = (e) => {
          const diff = e.layerX - this.leftX;
          const finalX = this.leftX + diff;

          if (finalX < 0) {
            this.leftX = 0;
          } else if (finalX > this.rightX - BORDER_WIDTH - this.minRange) {
            this.leftX = this.rightX - BORDER_WIDTH - this.minRange;
          } else {
            this.leftX = finalX;
          }

          this.update();
        }
      } else if (e.layerX >= this.rightX - BORDER_WIDTH && e.layerX <= this.rightX) {
        this.view.onmousemove = (e) => {
          const diff = e.layerX - this.rightX;
          const finalX = this.rightX + diff;

          if (finalX < this.leftX + BORDER_WIDTH + this.minRange) {
            this.rightX = this.leftX + BORDER_WIDTH + this.minRange;
          } else if (finalX > this.view.width) {
            this.rightX = this.view.width;
          } else {
            this.rightX = finalX;
          }

          this.update();
        }
      } else if (e.layerX > this.leftX + BORDER_WIDTH && e.layerX < this.rightX - BORDER_WIDTH) {
        let previousX = e.layerX;
        this.view.onmousemove = (e) => {
          const diff = e.layerX - previousX;

          if (this.leftX + diff < 0) {
            this.rightX += -this.leftX;
            this.leftX = 0;
          } else if (this.rightX + diff > this.view.width) {
            this.leftX += this.view.width - this.rightX;
            this.rightX = this.view.width;
          } else {
            this.leftX += diff;
            this.rightX += diff;
          }

          previousX = e.layerX;
          this.update();
        }
      }
    }
  }

  drawLeftSide() {
    this.ctx.fillStyle = convertHexToRgb(this.colors.secondary, 0.1);
    this.ctx.fillRect(0, 0, this.leftX, this.view.height);

    this.ctx.fillStyle = convertHexToRgb(this.colors.secondary, 0.2);
    this.ctx.fillRect(this.leftX, 0, BORDER_WIDTH, this.view.height);
  }

  drawRightSide() {
    this.ctx.fillStyle = convertHexToRgb(this.colors.secondary, 0.2);
    this.ctx.fillRect(this.rightX - BORDER_WIDTH, 0, BORDER_WIDTH, this.view.height);

    this.ctx.fillStyle = convertHexToRgb(this.colors.secondary, 0.1);
    this.ctx.fillRect(this.rightX, 0, this.view.width, this.view.height);
  }

  drawBorders() {
    const height = 2;
    const width = this.rightX - this.leftX - 2 * BORDER_WIDTH;
    this.ctx.fillStyle = convertHexToRgb(this.colors.secondary, 0.2);
    this.ctx.fillRect(this.leftX + BORDER_WIDTH, 0, width, height);
    this.ctx.fillRect(this.leftX + BORDER_WIDTH, this.view.height - height, width, height);
  }

  render() {
    this.ctx.clearRect(0,0,this.view.width, this.view.height)
    this.drawLeftSide();
    this.drawRightSide();
    this.drawBorders();
  }

  update() {
    const left = Math.floor(100 * this.leftX/this.view.width) / 100;
    const right = Math.ceil(100 * this.rightX/this.view.width) / 100;

    this.view.dispatchEvent(new CustomEvent('RANGE', {
      detail: [left, right]
    }));

    this.render();
  }

  setColors(colors) {
    this.colors = colors;
    this.render();
  }
}