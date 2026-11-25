// Tiny inline-SVG sparklines. sparkPoints is pure (tested); sparkline wraps it in DOM.
const round1 = n => Math.round(n * 10) / 10;

export function sparkPoints(values, w, h) {
  if (!values.length) return '';
  const min = Math.min(...values), max = Math.max(...values), pad = 2;
  const x = i => (values.length === 1 ? w / 2 : pad + (i * (w - 2 * pad)) / (values.length - 1));
  const y = v => (max === min ? h / 2 : pad + (1 - (v - min) / (max - min)) * (h - 2 * pad));
  return values.map((v, i) => round1(x(i)) + ',' + round1(y(v))).join(' ');
}

export function sparkline(values, { w = 80, h = 20, label = '' } = {}) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.setAttribute('class', 'spark');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label || (values.length ? 'trend from ' + values[0] + ' to ' + values.at(-1) : 'no data yet'));
  const pts = sparkPoints(values, w, h);
  if (values.length === 1) {
    const [cx, cy] = pts.split(',');
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', 2.5);
    svg.append(c);
  } else if (values.length > 1) {
    const line = document.createElementNS(NS, 'polyline');
    line.setAttribute('points', pts);
    svg.append(line);
  }
  return svg;
}
