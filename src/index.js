import Chart from './Chart';

window.onload = async () => {
  const response = await fetch('../chart_data.json');
  const data = await response.json();

  if (!window.Worker) {
    await import('../worker.js')
  }

  const chartsData = [];

  data.forEach(chunk => {
    const chartData = {
      linesByName: {},
      x: []
    };

    chunk.columns.forEach(column => {
      const id = column.shift();

      if (id === 'x') {
        chartData.x = column;
      } else {
        chartData.linesByName[chunk.names[id]] = {
          color: chunk.colors[id],
          values: column
        };
      }
    });

    chartsData.push(chartData);
  });

  const charts = [];


  const COLORS = {
    DAY: '#ffffff',
    NIGHT: '#00172d'
  }
  const modeSwitcher = document.createElement('div');
  document.body.appendChild(modeSwitcher);

  const dayRadio = document.createElement('input');
  dayRadio.type = 'radio';
  dayRadio.id = 'Day';
  dayRadio.checked = true;
  dayRadio.onchange = () => {
    if (dayRadio.checked) {
      nightRadio.checked = false;

      document.body.style.backgroundColor = COLORS.DAY;
      charts.forEach(chart => {
        chart.setColors({
          primary: COLORS.DAY,
          secondary: COLORS.NIGHT
        });
      })
    }
  }

  const dayLabel = document.createElement('label');
  dayLabel.for = dayRadio.id;
  dayLabel.style.color = 'grey';
  dayLabel.innerText = dayRadio.id;

  modeSwitcher.appendChild(dayLabel);
  modeSwitcher.appendChild(dayRadio);


  const nightRadio = document.createElement('input');
  nightRadio.type = 'radio';
  nightRadio.id = 'Night';
  nightRadio.onchange = () => {
    if (nightRadio.checked) {
      dayRadio.checked = false;

      document.body.style.backgroundColor = COLORS.NIGHT;
      charts.forEach(chart => {
        chart.setColors({
          primary: COLORS.NIGHT,
          secondary: COLORS.DAY
        });
      })
    }
  }

  const nightLabel = document.createElement('label');
  nightLabel.for = nightRadio.id;
  nightLabel.style.color = 'grey';
  nightLabel.innerText = nightRadio.id;
  modeSwitcher.appendChild(nightLabel);
  modeSwitcher.appendChild(nightRadio);

  chartsData.forEach((data, index) => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.margin = '10px';
    document.body.appendChild(container);

    charts.push(new Chart(index, container, data, { primary: COLORS.DAY, secondary: COLORS.NIGHT }));
  });
};
