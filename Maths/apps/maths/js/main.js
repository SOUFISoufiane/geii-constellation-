// Math Visualizer MVP - 3D Surface Plotter
import { PALETTE, COSMIC_COLORSCALE } from '../../signal-observatory/js/plots/plotly-config.js';

const inputFunc = document.getElementById('func-input');
const inputRange = document.getElementById('range-input');
const btnPlot = document.getElementById('btn-plot');
const errMsg = document.getElementById('error-msg');

function plotSurface() {
    errMsg.textContent = "";
    const funcStr = inputFunc.value;
    const range = parseFloat(inputRange.value) || 5;
    
    // Safety check - simplistic evaluation. In production, use math.js
    let f;
    try {
        f = new Function('x', 'y', `return ${funcStr};`);
        // Test call
        f(0,0);
    } catch (e) {
        errMsg.textContent = "Erreur de syntaxe JS dans la fonction.";
        return;
    }

    const n = 50;
    const xArr = [];
    const yArr = [];
    const zMatrix = [];

    const step = (2 * range) / (n - 1);

    for (let i = 0; i < n; i++) {
        const x = -range + i * step;
        xArr.push(x);
    }
    for (let j = 0; j < n; j++) {
        const y = -range + j * step;
        yArr.push(y);
    }

    for (let j = 0; j < n; j++) {
        const row = [];
        for (let i = 0; i < n; i++) {
            let z = 0;
            try {
                z = f(xArr[i], yArr[j]);
            } catch(e) { z = null; }
            row.push(z);
        }
        zMatrix.push(row);
    }

    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { l:0, r:0, t:0, b:0 },
        scene: {
            xaxis: { title: 'X', gridcolor: PALETTE.bgGrid },
            yaxis: { title: 'Y', gridcolor: PALETTE.bgGrid },
            zaxis: { title: 'Z', gridcolor: PALETTE.bgGrid },
            camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } }
        }
    };

    const data = [{
        z: zMatrix,
        x: xArr,
        y: yArr,
        type: 'surface',
        colorscale: COSMIC_COLORSCALE,
        showscale: false
    }];

    Plotly.react('plot', data, layout, { displayModeBar: false });
}

btnPlot.addEventListener('click', plotSurface);

// Initial
plotSurface();
