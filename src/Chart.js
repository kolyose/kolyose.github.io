import RenderController from './RenderController.js';
import LineRenderer from './LineRenderer.js';
import MinimapController from './MinimapController.js';
import RangeSelector from './RangeSelector.js';
import RulerRenderer from './RulerRenderer.js';
import DatesRenderer from './DatesRenderer.js';
import SampleRenderer from './SampleRenderer.js';

const MIN_RANGE = 0.1;

export default class Chart {
  constructor(id, container, data, colors) {
    this.container = container;
    this.data = data;
    this.colors = colors;

    const linesView = this.createView(400, 300, 'absolute');
    const rulersView = this.createView(400, 300, 'absolute');
    const datesView = this.createView(400, 300, 'absolute');
    datesView.style.marginTop = '30px';
    const sampleView = this.createView(400, 300, 'relative');


    this.renderController = new RenderController(
      `${id}_stage`,
      new LineRenderer(linesView, 2),
      new RulerRenderer(rulersView),
      new DatesRenderer(datesView),
      new SampleRenderer(sampleView)
    );
    this.renderController.setData(data);
    this.renderController.setColors(this.colors);

    const controls = document.createElement('div');
    controls.style.position = 'relative';
    controls.style.marginTop = '30px';
    controls.style.marginBottom = '5px';
    container.appendChild(controls);

    Object.entries(data.linesByName).forEach(([name, line]) => {
      const control = document.createElement('span');
      control.style.marginRight = '5px';
      controls.appendChild(control);

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = true;
      input.id = `control_${name}`;
      input.name = name;
      input.onchange = () => {
        if (input.checked) {
          this.renderController.showLines([{ name, ...line }]);
          this.minimapController.showLines([{ name, ...line }]);
        } else {
          this.renderController.hideLines([{ name }]);
          this.minimapController.hideLines([{ name }]);
        }
      }
      control.appendChild(input);

      const label = document.createElement('label');
      label.for = input.id;
      label.style.color = line.color;
      label.innerText = name;
      control.appendChild(label);
    })

    const minimapView = this.createView(400, 50, 'absolute');
    this.minimapController = new MinimapController(`${id}_minimap`, new LineRenderer(minimapView));
    this.minimapController.setData(data);
    this.minimapController.setColors(this.colors);
    this.minimapController.updateRange([0, 1]);

    const rangeView = this.createView(400, 50, 'relative');
    this.rangeSelector = new RangeSelector(rangeView, MIN_RANGE);
    rangeView.addEventListener('RANGE', ({ detail }) => {
      this.renderController.updateRange(detail);
    });
    this.rangeSelector.setColors(this.colors);
    this.rangeSelector.init();
  }

  setColors(colors) {
    this.colors = colors;
    this.container.style.backgroundColor = colors.primary;
    this.renderController.setColors(colors);
    this.minimapController.setColors(colors);
    this.rangeSelector.setColors(colors);
  }

  createView(width, height, position) {
    const view = document.createElement('canvas');
    view.width = width;
    view.height = height;
    view.style.position = position;
    this.container.appendChild(view);

    return view;
  }
}