export let eqCanvasActive = false;
let rafId = null;

export function renderEqCanvas(audioAnalyzerState) {
    const canvas = document.getElementById('fusion-eq-canvas');
    if (!canvas) return;

    // Show canvas, hide the plotly div if needed, but since they overlap and plotly is empty during streaming, we just show canvas
    canvas.style.display = 'block';
    
    // Resize to match container
    const rect = canvas.parentElement.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    const ctx = canvas.getContext('2d');
    
    // Read theme CSS variables
    const styles = getComputedStyle(document.body);
    const hueStart = parseFloat(styles.getPropertyValue('--eq-hue-start').trim()) || 260;
    const hueEnd = parseFloat(styles.getPropertyValue('--eq-hue-end').trim()) || 0;
    const saturation = styles.getPropertyValue('--eq-saturation').trim() || '100%';
    const lightness = styles.getPropertyValue('--eq-lightness').trim() || '60%';

    // We only need to start the animation loop once
    if (!eqCanvasActive) {
        eqCanvasActive = true;
        _drawLoop(canvas, ctx, audioAnalyzerState, { hueStart, hueEnd, saturation, lightness });
    } else {
        // Just update theme parameters dynamically
        canvas._eqParams = { hueStart, hueEnd, saturation, lightness };
    }
}

export function stopEqCanvas() {
    eqCanvasActive = false;
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    const canvas = document.getElementById('fusion-eq-canvas');
    if (canvas) {
        canvas.style.display = 'none';
    }
}

function _drawLoop(canvas, ctx, state, params) {
    if (!eqCanvasActive) return;

    canvas._eqParams = canvas._eqParams || params;
    const p = canvas._eqParams;

    const width = canvas.width;
    const height = canvas.height;

    // Semi-transparent clear for motion blur trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);

    const frame = state.lastFrame;
    if (frame && frame.magnitude) {
        const mag = frame.magnitude;
        const nBins = mag.length;
        
        // We might want to only show the lower half of frequencies for better visual balance
        const visibleBins = Math.floor(nBins * 0.7); 
        const barWidth = width / visibleBins;

        for (let i = 0; i < visibleBins; i++) {
            // mag[i] is in dB, usually from -100 to 0
            const db = mag[i];
            
            // Normalize to 0-1
            const normalized = Math.max(0, (db + 90) / 90); 
            
            const barHeight = normalized * height;
            
            // Map index to hue
            const t = i / visibleBins;
            const hue = p.hueStart + t * (p.hueEnd - p.hueStart);
            
            ctx.fillStyle = `hsl(${hue}, ${p.saturation}, ${p.lightness})`;
            
            // Draw bar from bottom
            ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
            
            // Add a bright glowing cap
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(i * barWidth, height - barHeight - 2, barWidth - 1, 2);
        }
    }

    rafId = requestAnimationFrame(() => _drawLoop(canvas, ctx, state, p));
}
