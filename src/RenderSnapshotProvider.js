
class RenderSnapshotProvider {
  constructor() {
    this.subscriptionsById = {};

    if (window.Worker) {
      this.worker = new window.Worker('./worker.js');
    } else {
      this.worker = {
        postMessage(data) {
          window.onmessage({ data });
        }
      }
      window.postMessage = data => {
        this.worker.onmessage({ data });
      };
    }

    this.worker.onmessage = ({ data }) => {
      const { id } = data;
      if (this.subscriptionsById[id] && typeof this.subscriptionsById[id] === 'function') {
        this.subscriptionsById[id](data);
      }
    }
  }

  subscribe(id, callback) {
    this.subscriptionsById[id] = callback;
  }

  request({ id, reason, payload }) {
    this.worker.postMessage({ id, reason, payload });
  }
}

export default new RenderSnapshotProvider();
