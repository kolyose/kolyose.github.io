import RenderController from "./RenderController";

export default class MinimapController{
  constructor(id, renderer) {
    this.controller = new RenderController(id, renderer);
  }

  setData(data) {
    this.controller.setData(data);
  }

  updateRange(range) {
    this.controller.updateRange(range);
  }

  showLines(lines) {
    this.controller.showLines(lines);
  }

  hideLines(lines) {
    this.controller.hideLines(lines);
  }

  setColors({primary, secondary}) {
  }
}