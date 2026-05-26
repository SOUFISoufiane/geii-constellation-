// Quine–McCluskey minimization → minimal Sum-of-Products.
// Input: minterms (array of decimal indices where output=1), nVars.
// Output: { terms: [ {pattern} ], sop: "AB' + C", latex: "..." }
// pattern is a string over {0,1,-} of length nVars, MSB first (A is bit nVars-1).

function combine(a, b) {
    // Combine two patterns differing in exactly one fixed bit → introduce '-'.
    let diff = 0, out = '';
    for (let i = 0; i < a.length; i++) {
        if (a[i] === b[i]) out += a[i];
        else { diff++; out += '-'; }
    }
    return diff === 1 ? out : null;
}

function coversMinterm(pattern, m, nVars) {
    for (let i = 0; i < nVars; i++) {
        const bit = (m >> (nVars - 1 - i)) & 1;
        if (pattern[i] !== '-' && +pattern[i] !== bit) return false;
    }
    return true;
}

export function minimize(minterms, nVars, varNames) {
    varNames = varNames || ['A','B','C','D'].slice(0, nVars);
    if (minterms.length === 0) return { terms: [], sop: '0', latex: 'S = 0' };
    if (minterms.length === (1 << nVars)) return { terms: [{ pattern: '-'.repeat(nVars) }], sop: '1', latex: 'S = 1' };

    // Step 1: prime-implicant generation by iterative combination.
    let groups = minterms.map(m => m.toString(2).padStart(nVars, '0'));
    groups = [...new Set(groups)];
    const primes = new Set();

    let current = groups.map(p => ({ p, used: false }));
    while (true) {
        const used = new Array(current.length).fill(false);
        const nextSet = new Map();
        for (let i = 0; i < current.length; i++) {
            for (let j = i + 1; j < current.length; j++) {
                const c = combine(current[i].p, current[j].p);
                if (c) { used[i] = used[j] = true; nextSet.set(c, { p: c, used: false }); }
            }
        }
        current.forEach((item, i) => { if (!used[i]) primes.add(item.p); });
        if (nextSet.size === 0) break;
        current = [...nextSet.values()];
    }

    // Step 2: prime-implicant chart → greedy cover (essentials first, then greedy).
    const primeList = [...primes];
    const uncovered = new Set(minterms);
    const chosen = [];

    // Essential primes: a minterm covered by exactly one prime.
    let changed = true;
    while (changed) {
        changed = false;
        for (const m of [...uncovered]) {
            const covering = primeList.filter(p => coversMinterm(p, m, nVars));
            if (covering.length === 1 && !chosen.includes(covering[0])) {
                chosen.push(covering[0]);
                primeList.filter(p => p === covering[0]).forEach(() => {});
                minterms.forEach(mm => { if (coversMinterm(covering[0], mm, nVars)) uncovered.delete(mm); });
                changed = true;
            }
        }
    }
    // Greedy: repeatedly pick the prime covering the most remaining minterms.
    while (uncovered.size > 0) {
        let best = null, bestCount = -1;
        for (const p of primeList) {
            if (chosen.includes(p)) continue;
            let cnt = 0; for (const m of uncovered) if (coversMinterm(p, m, nVars)) cnt++;
            if (cnt > bestCount) { bestCount = cnt; best = p; }
        }
        if (!best || bestCount <= 0) break;
        chosen.push(best);
        minterms.forEach(mm => { if (coversMinterm(best, mm, nVars)) uncovered.delete(mm); });
    }

    // Step 3: render each chosen pattern as a product term.
    const termText = [], termLatex = [], termVhdl = [];
    for (const pat of chosen) {
        let txt = '', tex = '', vhdl = [];
        for (let i = 0; i < nVars; i++) {
            if (pat[i] === '-') continue;
            const v = varNames[i];
            if (pat[i] === '1') { txt += v; tex += v; vhdl.push(v); }
            else { txt += v + "'"; tex += `\\overline{${v}}`; vhdl.push(`(not ${v})`); }
        }
        termText.push(txt || '1'); termLatex.push(tex || '1'); termVhdl.push(vhdl.length ? vhdl.join(' and ') : "'1'");
    }

    return {
        terms: chosen.map(p => ({ pattern: p })),
        sop: termText.join(' + '),
        latex: 'S = ' + termLatex.join(' + '),
        vhdlExpr: termVhdl.map(t => `(${t})`).join(' or ')
    };
}
