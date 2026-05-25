global.window = global;
global.document = { body: {} };
global.window.Plotly = {};
global.window.renderMathInElement = () => {};
global.MathJax = {};

import('./js/main.js').then(() => console.log('Import successful!')).catch(e => console.error('Import failed:', e));
