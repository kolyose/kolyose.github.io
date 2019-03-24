import { convertHexToRgb } from './util';

export default class LineRenderer {
  constructor(canvas, lineWidth=1) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.translate(0, this.canvas.height);
    this.ctx.scale(1,-1);
    this.renderQueue = [];
    this.isRendering = false;
    this.lineWidth = lineWidth;
  }

  render(snapshot) {
    if (this.isRendering) {
      this.renderQueue.push(snapshot);
      return;
    }

    this.isRendering = true;

    requestAnimationFrame(() => {
      const pathes = Object.values(snapshot.linesByName).map(({renderValues, color, opacity }) => (
        { path: this.createPath(renderValues), color, opacity }
      ));

      this.ctx.save()
      this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);

      pathes.forEach(({ path, color, opacity }) => {
        this.ctx.strokeStyle = convertHexToRgb(color, opacity);
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineJoin = "round";
        this.ctx.stroke(path);
      });

      this.ctx.restore();
      this.isRendering = false;

      if (this.renderQueue.length) {
        this.render(this.renderQueue.shift());
      }
    });

  }

  createPath(values) {
    const path = new Path2D();
    const stepX = 1 / (values.length-1);

    values.forEach((value, index) => {
      const point = {
        x: (stepX * index * this.canvas.width),
        y: (value * this.canvas.height)
      };
      path.lineTo(point.x, point.y);
    });
    return path;
  }

  setColors({primary, secondary}) {
    this.canvas.style.backgroundColor = primary;
  }
}