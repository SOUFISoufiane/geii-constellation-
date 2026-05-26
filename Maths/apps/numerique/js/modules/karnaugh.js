// Karnaugh map renderer. Lays out the truth-table outputs in Gray-code order
// and renders an HTML table; relies on quine-mccluskey for the minimal SOP.
import { minimize } from './quine-mccluskey.js';

// Gray code sequence of n bits.
const gray = (n) => { const out = []; for (let i = 0; i < (1 << n); i++) out.push(i ^ (i >> 1)); return out; };

// Map (rowGray, colGray) → decimal minterm index, given the bit split.
function mintermIndex(rowBits, colBits, rowVal, colVal) {
    // high bits = rows, low bits = cols
    return (rowVal << colBits) | colVal;
}

export function renderKmap(hostEl, eqEl, outputs, nVars, varNames) {
    // Split variables: rows take the high half, cols the low half.
    const colBits = Math.ceil(nVars / 2);
    const rowBits = nVars - colBits;
    const rowSeq = gray(rowBits);
    const colSeq = gray(colBits);

    const rowVars = varNames.slice(0, rowBits).join('');
    const colVars = varNames.slice(rowBits).join('');

    const minterms = [];
    outputs.forEach((v, i) => { if (v === 1) minterms.push(i); });
    const result = minimize([...minterms], nVars, varNames);

    // Build the table.
    let html = `<table class="kmap"><thead><tr><th class="corner">${rowVars}\\${colVars}</th>`;
    colSeq.forEach(cv => html += `<th>${cv.toString(2).padStart(colBits, '0')}</th>`);
    html += `</tr></thead><tbody>`;
    rowSeq.forEach(rv => {
        html += `<tr><th>${rowBits ? rv.toString(2).padStart(rowBits, '0') : '·'}</th>`;
        colSeq.forEach(cv => {
            const idx = mintermIndex(rowBits, colBits, rv, cv);
            const val = outputs[idx] || 0;
            html += `<td class="${val ? 'one' : 'zero'}" data-idx="${idx}">${val}</td>`;
        });
        html += `</tr>`;
    });
    html += `</tbody></table>`;
    hostEl.innerHTML = html;

    if (window.katex) {
        katex.render(result.latex, eqEl, { displayMode: true, throwOnError: false });
    } else {
        eqEl.textContent = result.sop;
    }
    return result;
}
