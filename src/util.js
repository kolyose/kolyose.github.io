export const convertHexToRgb = (hex, alpha=1) => {
  const channelsHex = /([A-F\d]{2})([A-F\d]{2})([A-F\d]{2})$/i.exec(hex).slice(1);
  const channelsRgb = channelsHex.map(value => parseInt(value, 16));

  return `rgb(${channelsRgb[0]},${channelsRgb[1]},${channelsRgb[2]},${alpha})`;
};