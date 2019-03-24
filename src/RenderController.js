import RenderSnapshotProvider from './RenderSnapshotProvider';

export default class RenderController {
  constructor(id, lineRenderer, rulerRenderer, datesRenderer, sampleRenderer) {
    this.id = id;
    this.lineRenderer = lineRenderer;
    this.rulerRenderer = rulerRenderer;
    this.datesRenderer = datesRenderer;
    this.sampleRenderer = sampleRenderer;

    this.range = null;
    this.renderData = null;
    this.renderCache = null;

    RenderSnapshotProvider.subscribe(this.id, data => {
      const { reason, payload } = data;

      this.renderCache = payload;
      lineRenderer.render(payload);

      const snapshot = Object.keys(payload.linesByName).length
        ? payload
        : { max: null, x: null };

      if (rulerRenderer) rulerRenderer.render(snapshot);
      if (datesRenderer) datesRenderer.render(snapshot);
      if (sampleRenderer) sampleRenderer.render(snapshot);

    });
  }

  setData({ x, linesByName}) {
    this.renderData = {
      x,
      linesByName: Object.entries(linesByName)
                    .reduce((result, [name, line]) => ({ ...result, [name]: line }), {})
    }
  }

  updateRange(range) {
    if (range) {
      this.range = range;
    }

    this.triggerRender({ reason: 'RANGE' });
  }

  showLines(lines) {
    lines.forEach(({ name, color, values }) => {
      this.renderData.linesByName[name] = { color, values };
    });
    this.triggerRender({ reason: 'LINES', lines });
  }

  hideLines(lines) {
    lines.forEach(({ name }) => {
      delete this.renderData.linesByName[name];
    });
    this.triggerRender({ reason: 'LINES' });
  }

  triggerRender({ reason, lines }) {
    this.requestId++;
    RenderSnapshotProvider.request({
      id: this.id,
      reason,
      payload: {
        renderData: this.renderData,
        renderCache: this.renderCache,
        range: this.range,
        lines
      }
    });
  }

  setColors(colors) {
    this.lineRenderer.setColors(colors);
    this.rulerRenderer.setColors(colors);
    this.datesRenderer.setColors(colors);
    this.sampleRenderer.setColors(colors);
  }
}