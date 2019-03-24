import { convertHexToRgb } from './util';

export default class SampleRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.datesByTimestamp = {};

    this.canvas.onmouseleave = () => {
      this.canvas.onmousemove = null;
      this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    };

    this.canvas.onmouseenter = () => {
      this.canvas.onmousemove = (e) => {
        this.update(e.layerX/this.canvas.width);
      };
    };
  }

  render(snapshot) {
    this.snapshot = snapshot;
  }

  update(posX) {
    if (!this.snapshot.x) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    const length = this.snapshot.x.length;
    const index = Math.round((length-1) * posX);
    const stepX = 1 / (length-1);
    const x = Math.ceil(stepX * index * this.canvas.width);

    this.ctx.restore();
    this.ctx.save();
    this.ctx.lineWidth = .2;
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.colors.secondary;
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, this.canvas.height)
    this.ctx.stroke();

    const samples = [];

    Object.entries(this.snapshot.linesByName).forEach(([name, { values, renderValues, color }]) => {
      const y = Math.ceil(this.canvas.height - renderValues[index] * this.canvas.height);

      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = color;
      this.ctx.stroke();
      this.ctx.fillStyle = this.colors.primary;
      this.ctx.fill();

      samples.push({
        value: values[index],
        color,
        name
      });
    });

    const timestamp = this.snapshot.x[index];
    if (!this.datesByTimestamp[timestamp]) {
      this.datesByTimestamp[timestamp] = new Date(timestamp)
        .toLocaleString('en-us', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    const date = this.datesByTimestamp[timestamp];
    const GAP = 8;
    const dateWidth = this.ctx.measureText(date).width;
    const maxWidth = Math.round(samples.reduce(
      (maxWidth, { value }) => {
        return Math.max(maxWidth, this.ctx.measureText(value.toString()).width)
      },
      dateWidth
    )) + 2 * GAP;

    const lineHeight = 3 * GAP;
    const rectWidth = maxWidth + 3 * GAP;
    const rectHeight = lineHeight + samples.length * lineHeight;
    const rectY = GAP;
    const rectX = x + GAP + maxWidth < this.canvas.width
      ? x + GAP
      : x - (GAP + rectWidth);
    const titleY = rectY + 2 * GAP;

    this.ctx.save();
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;
    this.ctx.shadowBlur = 3;
    this.ctx.shadowColor = convertHexToRgb(this.colors.secondary, 0.1);
    this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
    this.ctx.restore();

    this.ctx.fillStyle = this.colors.secondary;
    this.ctx.font = '100 normal 14px arial';
    this.ctx.fillText(date, rectX + GAP, titleY);

    samples.forEach(({ value, color, name }, index) => {
      const sampleY = titleY + 3 * GAP * (index + 1)
      const sampleX = rectX + GAP;
      const valueWidth = this.ctx.measureText(value).width;

      this.ctx.save();
      this.ctx.fillStyle = color;

      this.ctx.font = '100 bold 12px arial';
      this.ctx.fillText(value, sampleX, sampleY);

      this.ctx.font = '100 normal 10px arial';
      this.ctx.fillText(name, sampleX + valueWidth + GAP, sampleY);
      this.ctx.restore();
    });
  }

  setColors(colors) {
    this.colors = colors;
  }
}