// 3D surface plotter z = f(x, y).
import { PALETTE, COSMIC_COLORSCALE } from '../../../signal-observatory/js/plots/plotly-config.js';

export function initSurface() {
    const inputFunc = document.getElementById('func-input');
    const inputRange = document.getElementById('range-input');
    const btnPlot = document.getElementById('btn-plot');
    const errMsg = document.getElementById('error-msg');

    function plot() {
        errMsg.textContent = '';
        let f;
        try { f = new Function('x', 'y', `return ${inputFunc.value};`); f(0, 0); }
        catch (e) { errMsg.textContent = 'Erreur de syntaxe JS dans la fonction.'; return; }

        const range = parseFloat(inputRange.value) || 5;
        const n = 50, step = (2 * range) / (n - 1);
        const xArr = [], yArr = [], z = [];
        for (let i = 0; i < n; i++) xArr.push(-range + i * step);
        for (let j = 0; j < n; j++) yArr.push(-range + j * step);
        for (let j = 0; j < n; j++) {
            const row = [];
            for (let i = 0; i < n; i++) { let v; try { v = f(xArr[i], yArr[j]); } catch { v = null; } row.push(v); }
            z.push(row);
        }
        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', margin: { l:0, r:0, t:0, b:0 },
            scene: {
                xaxis: { title: 'X', gridcolor: PALETTE.bgGrid },
                yaxis: { title: 'Y', gridcolor: PALETTE.bgGrid },
                zaxis: { title: 'Z', gridcolor: PALETTE.bgGrid },
                camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } }
            }
        };
        Plotly.react('plot-surface', [{ z, x: xArr, y: yArr, type: 'surface', colorscale: COSMIC_COLORSCALE, showscale: false }],
            layout, { displayModeBar: false, responsive: true });
    }

    btnPlot.addEventListener('click', plot);
    inputFunc.addEventListener('keydown', e => { if (e.key === 'Enter') plot(); });
    plot();
}
