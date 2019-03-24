const INTERPOLATION_FACTOR = 10;

onmessage = async ({ data }) => {
  const { id, reason, payload } = data;

  if (!id) {
    return;
  }

  const { renderData, renderCache, range, lines } = payload;
  const finalSnapshot = createFinalSnapshot(renderData, range);
  let initialSnapshot;

  if (reason === 'RANGE') {
    postMessage({ id, reason, payload: finalSnapshot });
    return;
  }

  initialSnapshot = { linesByName: {}, max: 0 };
  if (renderCache) {
    Object.entries(renderCache.linesByName).forEach(([name, { renderValues, color }]) => {
      initialSnapshot.linesByName[name] = {
        renderValues: [ ...renderValues ],
        interpolationSteps: [],
        opacity: 1,
        color
      }
    });
    initialSnapshot.max = renderCache.max;
  }
  if (lines) {
    lines.forEach(({ name, color }) => {
      initialSnapshot.linesByName[name] = {
        renderValues: finalSnapshot.linesByName[name].renderValues.map(value => value + 1),
        interpolationSteps: [],
        opacity: 0,
        opacityStep: 1/INTERPOLATION_FACTOR,
        color
      };
    });
  }

  const generator = generateInterpolatedSnapshots(initialSnapshot, finalSnapshot);
  for (let interpolatedSnapshot of generator) {
    postMessage({ id, reason, payload: interpolatedSnapshot });
  }

  postMessage({ id, reason, payload: finalSnapshot });
};


function* generateInterpolatedSnapshots(initialSnapshot, finalSnapshot) {
  Object.entries(initialSnapshot.linesByName).forEach(([name, initialLine]) => {
    const finalLine = finalSnapshot.linesByName[name];

    initialLine.renderValues.forEach((initialValue, index) => {
      const interpolationDelta = finalLine ? finalLine.renderValues[index] - initialValue : 1;
      const interpolationStep = interpolationDelta / INTERPOLATION_FACTOR;

      initialLine.interpolationSteps.push(interpolationStep);
      initialLine.opacityStep = finalLine ? 1/INTERPOLATION_FACTOR : -1/INTERPOLATION_FACTOR;
    });

  });

  for (let i=1; i<INTERPOLATION_FACTOR-1; i++) {
    const intepolatedSnapshot = {
      x: [ ...finalSnapshot.x ],
      max: initialSnapshot.max + i * (finalSnapshot.max - initialSnapshot.max)/INTERPOLATION_FACTOR,
      linesByName: {}
    };

    Object.entries(initialSnapshot.linesByName).forEach(
      ([name, { renderValues, interpolationSteps, color, opacity, opacityStep }]) => {
        intepolatedSnapshot.linesByName[name] = {
          renderValues: renderValues.map((value, index) => value + interpolationSteps[index] * i),
          opacity: Math.min(opacity + opacityStep * i, 1),
          color,
        }
    });

    yield intepolatedSnapshot;
  }
}

function createFinalSnapshot(renderData, range) {
  const snapshot = {
    x: slice(renderData.x, range),
    linesByName: {},
    max: 0
  };

  Object.entries(renderData.linesByName)
    .forEach(([name, { color, values }]) => {
      snapshot.linesByName[name] = {
        values: slice(values, range),
        color
      }
    });

  const max = Object.values(snapshot.linesByName)
    .reduce((max, { values }) => Math.max.apply(null, [ ...values, max ]), 0);

  snapshot.max = max;

  Object.values(snapshot.linesByName).forEach(line => {
    line.renderValues = normalize(line.values, max);
  });

  return snapshot;
};

function normalize(values, max) {
  return values.map(value => (value / max));
}

function slice(values, range) {
  const length = values.length;
  const start = Math.floor(length * range[0]);
  const end = Math.ceil(length * range[1]);

  return values.slice(start, end);
}