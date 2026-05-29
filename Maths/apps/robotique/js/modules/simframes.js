import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';
import { renderPlot } from '../../../../shared/js/plot-fit.js';
import { DEG, I4, fk6, poseToMatrix, matrixToPose, valCompose, originOf, frameTriad, linkTrace, pointTrace } from './robokit.js';

export function initSimFrames() {
    const el = id => document.getElementById(id);
    
    // Inputs
    const cbRobot = el('sf-show-robot');
    const cbFrames = el('sf-show-frames');
    
    const faFields = ['x','y','z','rx','ry','rz'].map(k => el(`sf-fa-${k}`));
    const fbFields = ['x','y','z','rx','ry','rz'].map(k => el(`sf-fb-${k}`));
    
    const readout = el('sf-readout');

    function render() {
        const showRobot = cbRobot.checked;
        const showFrames = cbFrames.checked;
        
        // Read poses from UI
        const poseA = {};
        ['x','y','z','rx','ry','rz'].forEach((k,i) => { poseA[k] = +faFields[i].value || 0; });
        
        const poseB_rel = {};
        ['x','y','z','rx','ry','rz'].forEach((k,i) => { poseB_rel[k] = +fbFields[i].value || 0; });
        
        // Compute composed pose for Frame B
        const poseB_abs = valCompose(poseA, poseB_rel);
        const matA = poseToMatrix(poseA);
        const matB = poseToMatrix(poseB_abs);

        let traces = [];
        
        // 1. Draw World Frame
        traces.push(...frameTriad(I4(), 0.8, { width: 3, labels: ['X', 'Y', 'Z World'] }));

        // 2. Draw Robot
        if (showRobot) {
            // Default zero-pose for the robot
            const qr = [0, 0, 0, 0, 0, 0];
            const robotFrames = fk6(qr);
            const pts = robotFrames.map(originOf);
            
            traces.push(linkTrace(pts, PALETTE.cyan, 'Bras 6R', 9));
            traces.push({ 
                type:'scatter3d', mode:'markers',
                x:pts.slice(0,6).map(p=>p[0]), y:pts.slice(0,6).map(p=>p[1]), z:pts.slice(0,6).map(p=>p[2]),
                marker:{ size:6, color:PALETTE.gold }, name:'Articulations', showlegend:false, hoverinfo:'skip' 
            });
        }
        
        // 3. Draw Frames
        if (showFrames) {
            // Repère A
            traces.push(...frameTriad(matA, 0.6, { width: 4, labels: ['X_A', 'Y_A', 'Z_A'] }));
            traces.push(pointTrace(originOf(matA), PALETTE.gold, 'Origine A', 'circle', 6));
            
            // Repère B
            traces.push(...frameTriad(matB, 0.6, { width: 4, labels: ['X_B', 'Y_B', 'Z_B'] }));
            traces.push(pointTrace(originOf(matB), PALETTE.cyan, 'Origine B', 'square', 6));
            
            // Draw a dotted line to show relationship from A to B
            const orgA = originOf(matA);
            const orgB = originOf(matB);
            traces.push({
                type:'scatter3d', mode:'lines',
                x: [orgA[0], orgB[0]], y: [orgA[1], orgB[1]], z: [orgA[2], orgB[2]],
                line:{ color: PALETTE.textDim, width: 2, dash: 'dash' }, name: 'A → B', showlegend: false, hoverinfo:'skip'
            });
        }

        const layout = baseLayout({
            title:{ text:`Simulateur de Repères & Compositions`, font:{color:PALETTE.textMid} },
            showlegend:false, margin:{t:30,b:0,l:0,r:0},
            scene:{
                xaxis:{title:'x', range:[-3,3], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                yaxis:{title:'y', range:[-3,3], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                zaxis:{title:'z', range:[0,3], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                aspectmode:'cube', camera:{ eye:{x:1.6,y:1.6,z:1.0} }
            }
        });
        
        renderPlot('plot-simframes', traces, layout, { displayModeBar:false });

        const f = v => v.toFixed(3);
        const frA = `<span style="color:var(--accent-gold)">A(x:${f(poseA.x)}, y:${f(poseA.y)}, z:${f(poseA.z)})</span>`;
        const frB_abs = `<span style="color:var(--accent-cyan)">B(x:${f(poseB_abs.x)}, y:${f(poseB_abs.y)}, z:${f(poseB_abs.z)})</span>`;
        
        readout.innerHTML = `
            <div>Repère A (World) : ${frA}</div>
            <div>Repère B (World) : ${frB_abs}</div>
            <div style="color:var(--text-dim); margin-top:4px;">B = A * B_relatif</div>
        `;
    }

    // Attach events
    [cbRobot, cbFrames, ...faFields, ...fbFields].forEach(el => {
        el.addEventListener('input', render);
        el.addEventListener('change', render);
    });

    render();
}
