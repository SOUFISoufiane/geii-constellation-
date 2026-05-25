// Digital Lab MVP - Truth Table generator
const selectVar = document.getElementById('var-count');
const thead = document.getElementById('tt-head');
const tbody = document.getElementById('tt-body');
const eqOut = document.getElementById('equation-out');

let outputs = [];

function generateTable() {
    const n = parseInt(selectVar.value);
    const rows = Math.pow(2, n);
    const vars = ['A', 'B', 'C', 'D'].slice(0, n);

    // Header
    thead.innerHTML = `<tr>${vars.map(v => `<th>${v}</th>`).join('')}<th style="color:var(--accent-green)">S</th></tr>`;

    // Ensure outputs array is correct size
    if (outputs.length !== rows) {
        outputs = new Array(rows).fill(0);
    }

    // Body
    let html = '';
    for (let i = 0; i < rows; i++) {
        let cells = '';
        for (let j = n - 1; j >= 0; j--) {
            const val = (i >> j) & 1;
            cells += `<td>${val}</td>`;
        }
        const sVal = outputs[i];
        const btnClass = sVal ? 'out-btn on' : 'out-btn';
        cells += `<td><button class="${btnClass}" data-row="${i}">${sVal}</button></td>`;
        html += `<tr>${cells}</tr>`;
    }
    tbody.innerHTML = html;

    // Attach events
    tbody.querySelectorAll('.out-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = parseInt(e.target.getAttribute('data-row'));
            outputs[row] = outputs[row] === 0 ? 1 : 0;
            generateTable();
        });
    });

    updateEquation(n, vars);
}

function updateEquation(n, vars) {
    const minterms = [];
    for (let i = 0; i < outputs.length; i++) {
        if (outputs[i] === 1) {
            let term = '';
            for (let j = n - 1; j >= 0; j--) {
                const bit = (i >> j) & 1;
                const v = vars[n - 1 - j];
                term += bit ? v : `\\overline{${v}}`;
            }
            minterms.push(term);
        }
    }

    let latex = "S = 0";
    if (minterms.length > 0) {
        latex = "S = " + minterms.join(' + ');
    }
    if (minterms.length === outputs.length) {
        latex = "S = 1";
    }

    if (window.katex) {
        katex.render(latex, eqOut, { displayMode: true });
    } else {
        eqOut.textContent = latex; // Fallback
    }
}

selectVar.addEventListener('change', () => {
    outputs = []; // reset on var change
    generateTable();
});

// Initial
setTimeout(() => {
    if (window.katex) generateTable();
    else {
        // wait for katex script
        const wait = setInterval(() => {
            if(window.katex) {
                clearInterval(wait);
                generateTable();
            }
        }, 100);
    }
}, 50);
