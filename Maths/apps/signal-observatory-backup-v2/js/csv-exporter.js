// ═══════════════════════════════════════════════════════════════════
//  CSV EXPORTER — Export signal data to CSV (Tier 2 Phase 1)
// ═══════════════════════════════════════════════════════════════════

export function exportToCsv(signalName, computed) {
    if (!computed || !computed.timeData || !computed.magData) {
        console.warn('[CSV Exporter] No computed data available for export');
        return;
    }

    const len = Math.max(computed.timeData.length, computed.magData.length);
    let csv = "Index,Time_Amplitude,Freq_Magnitude,Freq_Phase(rad)\n";
    
    for (let i = 0; i < len; i++) {
        const timeVal = (i < computed.timeData.length) ? computed.timeData[i] : '';
        const magVal = (i < computed.magData.length) ? computed.magData[i] : '';
        const phaseVal = (i < computed.phaseData.length) ? computed.phaseData[i] : '';
        
        csv += `${i},${timeVal},${magVal},${phaseVal}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const filename = `${signalName.replace(/\s+/g, '_')}_data_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}.csv`;

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    console.log(`[CSV Exporter] Exported ${len} rows to ${filename}`);
}
