import { convertHexToRgb } from './util';

const ANIMATION_DURATION = 20;

export default class DatesRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.markersDensity = Math.round(this.canvas.width / 80);
    this.timestampsCache = [];
    this.indexStep = 0;
    this.stepX = 0;
    this.markersByTimestamp = {};
    this.animationIteration = 0;
    this.animationId = null;
    this.labelsByTimestamp = {};
    this.colors = {};
  }

  render(snapshot) {
    const { x: timestamps } = snapshot;

    if (!timestamps) {
      this.timestampsCache = [];
      this.reset({});
      return;
    }

    this.timestampsCache = timestamps;

    // recalculate marker indexes and positions
    const indexStep = Math.floor(timestamps.length/this.markersDensity);
    this.stepX = 1 / (this.timestampsCache.length - 1);

    // construct an array for new markers and fill it with the existing ones
    const newMarkers = Object.entries(this.markersByTimestamp)
      .map(([timestamp, marker]) => ({ ...marker, timestamp }))
      .sort((a, b) => (a.timestamp - b.timestamp));

    if (newMarkers.length) {
      // add new markers to the left side
      const firstIndex = this.findMarkerIndex(newMarkers[0]);
      if (~firstIndex) {
        let index = firstIndex - this.indexStep;
        while (index >= 0) {
          const timestamp = this.timestampsCache[index];

          newMarkers.unshift({
            timestamp,
            label: this.getLabelByTimestamp(timestamp),
            opacity: 1,
            opacityChange: 0
          });
          index -= this.indexStep;
        }
      }

      // add new markers to the left side
      const lastIndex = this.findMarkerIndex(newMarkers[newMarkers.length-1]);
      if (~lastIndex) {
        let index = lastIndex + this.indexStep;
        while (index < this.timestampsCache.length) {
          const timestamp = this.timestampsCache[index];

          newMarkers.push({
            timestamp,
            label: this.getLabelByTimestamp(timestamp),
            opacity: 1,
            opacityChange: 0
          });
          index += this.indexStep;
        }
      }
    }

    // compose final object with markers to be rendered
    this.markersByTimestamp = {};
    newMarkers.forEach(({timestamp, ...rest}) => {
      this.markersByTimestamp[timestamp] = { ...rest };
    });

    if (Math.abs(indexStep - this.indexStep) < 2) {
      this.renderMarkers(this.markersByTimestamp);
    } else {
      const newMarkersByTimestamp = {};
      this.indexStep = indexStep;

      let index = 0;
      while (index < timestamps.length) {
        newMarkersByTimestamp[timestamps[index]] = {
          label: this.getLabelByTimestamp(timestamps[index]),
          opacity: 0,
          opacityChange: 1
        };

        index += this.indexStep;
      }

      Object.entries(newMarkersByTimestamp).forEach(([timestamp, marker]) => {
        if (this.markersByTimestamp[timestamp]) {
          marker = {
            ...marker,
            opacity: 1,
            opacityChange: 0
          };
        }
      });

      Object.entries(this.markersByTimestamp).forEach(([timestamp, marker]) => {
        if (!newMarkersByTimestamp[timestamp]) {
          newMarkersByTimestamp[timestamp] = {
            ...marker,
            opacity: 1,
            opacityChange: -1
          };
        }
      });

      if (this.animationId) {
        this.reset(newMarkersByTimestamp)
      }

      this.animate(newMarkersByTimestamp);
    }
  }

  reset(markersByTimestamp) {
    cancelAnimationFrame(this.animationId);
    this.animationId = null;
    this.animationIteration = 0;
    this.markersByTimestamp = {};

    Object.entries(markersByTimestamp).forEach(([timestamp, marker]) => {
      if (marker.opacityChange >= 0) {
        this.markersByTimestamp[timestamp] = {
          ...marker,
          opacity: 1,
          opacityChange: 0
        }
      }
    });

    this.render({ x: this.timestampsCache});
  }

  animate(markersByTimestamp) {
    this.animationIteration++;

    this.renderMarkers(markersByTimestamp);

    if (this.animationIteration < ANIMATION_DURATION) {
      this.animationId = requestAnimationFrame(() => {
        this.animate(markersByTimestamp);
      });
    } else {
      this.reset(markersByTimestamp);
    }
  }

  renderMarkers(markersByTimestamp) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    Object.entries(markersByTimestamp).forEach(([timestamp, marker]) => {
      const index = this.findMarkerIndex({timestamp});

      if (~index) {
        marker.opacity += (this.animationIteration+1)/ANIMATION_DURATION * marker.opacityChange;

        const text = marker.label;
        const x = this.stepX * index * this.canvas.width;
        const y = this.canvas.height - 10;

        this.ctx.save();
        this.ctx.fillStyle = convertHexToRgb(this.colors.secondary, marker.opacity);
        this.ctx.font = '100 normal 10px arial';
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
      }
    });
  }

  findMarkerIndex(marker) {
    return this.timestampsCache.findIndex(timestamp => timestamp == marker.timestamp)
  }

  getLabelByTimestamp(timestamp) {
    if (!this.labelsByTimestamp[timestamp]) {
      this.labelsByTimestamp[timestamp] = new Date(Number(timestamp)).toLocaleString('en-us', { month: 'short', day: 'numeric' });
    }

    return this.labelsByTimestamp[timestamp];
  }

  setColors(colors) {
    this.colors = colors;
    this.renderMarkers(this.markersByTimestamp);
  }
}