// Kirchhoff — two-mesh resistor network solved by mesh-current analysis.
//
//   Circuit:  E ── R1 ──┬── R3 ──┐
//                       │         │
//                      R2  (shared central branch)
//                       │         │
//                       └─────────┘  (common ground rail)
//
//   Mesh 1 (left, current I1) and Mesh 2 (right, current I2) share R2.
//   KVL:  (R1+R2) I1 − R2 I2 = E
//        −R2 I1 + (R2+R3) I2 = 0
//   Solve the 2×2 system with Cramer's rule.

export function initKirchhoff() {
    const ids = ['e', 'r1', 'r2', 'r3'];
    const els = {};
    ids.forEach(k => { els[k] = document.getElementById('k-' + k); els['v' + k] = document.getElementById('val-k-' + k); });
    const readout = document.getElementById('k-readout');
    const eqBox = document.getElementById('k-eq');
    const svgHost = document.getElementById('k-svg');

    function solve(E, R1, R2, R3) {
        // [[R1+R2, -R2], [-R2, R2+R3]] · [I1, I2] = [E, 0]
        const a = R1 + R2, b = -R2, cc = -R2, d = R2 + R3;
        const det = a * d - b * cc;
        const I1 = (E * d - b * 0) / det;        // Cramer
        const I2 = (a * 0 - E * cc) / det;
        const Ir2 = I1 - I2;                       // current through shared branch
        const Vr2 = Ir2 * R2;
        return { I1, I2, Ir2, Vr2 };
    }

    function svg(E, R1, R2, R3, s) {
        const A = PALETTE();
        const c = (n) => (n * 1000).toFixed(2); // mA helper
        return `
        <svg viewBox="0 0 460 240" width="100%" height="220" font-family="Space Mono, monospace" font-size="11">
          <!-- outer rails -->
          <rect x="40" y="40" width="380" height="160" fill="none" stroke="${A.rim}" stroke-width="1.5"/>
          <!-- source E (left side) -->
          <circle cx="40" cy="120" r="16" fill="none" stroke="${A.gold}" stroke-width="2"/>
          <text x="40" y="124" text-anchor="middle" fill="${A.gold}">E</text>
          <text x="12" y="124" fill="${A.gold}">${E}V</text>
          <!-- R1 top-left -->
          <rect x="110" y="32" width="60" height="16" fill="${A.void}" stroke="${A.red}" stroke-width="2"/>
          <text x="140" y="26" text-anchor="middle" fill="${A.red}">R1=${R1}Ω</text>
          <!-- R3 top-right -->
          <rect x="290" y="32" width="60" height="16" fill="${A.void}" stroke="${A.red}" stroke-width="2"/>
          <text x="320" y="26" text-anchor="middle" fill="${A.red}">R3=${R3}Ω</text>
          <!-- R2 central vertical branch -->
          <line x1="230" y1="48" x2="230" y2="192" stroke="${A.rim}" stroke-width="1.5"/>
          <rect x="222" y="104" width="16" height="48" fill="${A.void}" stroke="${A.green}" stroke-width="2"/>
          <text x="244" y="132" fill="${A.green}">R2=${R2}Ω</text>
          <!-- mesh current arrows -->
          <text x="130" y="130" fill="${A.cyan}">↻ I1</text>
          <text x="320" y="130" fill="${A.magenta}">↻ I2</text>
          <!-- live current annotations -->
          <text x="120" y="60" fill="${A.cyan}">${c(s.I1)} mA</text>
          <text x="300" y="60" fill="${A.magenta}">${c(s.I2)} mA</text>
          <text x="244" y="150" fill="${A.green}">${c(s.Ir2)} mA · ${s.Vr2.toFixed(2)} V</text>
        </svg>`;
    }

    function PALETTE() {
        const cs = getComputedStyle(document.body);
        const v = (n, f) => (cs.getPropertyValue(n).trim() || f);
        return {
            rim: v('--rim', '#2a2a55'), void: v('--void', '#05050f'),
            gold: v('--accent-gold', '#ffd60a'), red: v('--accent-red', '#ff5c7a'),
            green: v('--accent-green', '#00f5d4'), cyan: v('--accent-cyan', '#4f8cff'),
            magenta: v('--accent-magenta', '#f15bb5')
        };
    }

    function update() {
        const E = +els.e.value, R1 = +els.r1.value, R2 = +els.r2.value, R3 = +els.r3.value;
        ids.forEach(k => els['v' + k].textContent = els[k].value);
        const s = solve(E, R1, R2, R3);

        svgHost.innerHTML = svg(E, R1, R2, R3, s);
        readout.innerHTML = `
            <div style="color:var(--accent-cyan)">I₁ = ${(s.I1*1000).toFixed(3)} mA</div>
            <div style="color:var(--accent-magenta)">I₂ = ${(s.I2*1000).toFixed(3)} mA</div>
            <div style="color:var(--accent-green)">I(R2) = ${(s.Ir2*1000).toFixed(3)} mA</div>
            <div style="color:var(--accent-gold)">V(R2) = ${s.Vr2.toFixed(3)} V</div>`;

        if (window.katex) {
            katex.render(
                `\\begin{cases}(R_1{+}R_2)\\,I_1 - R_2\\,I_2 = E\\\\ -R_2\\,I_1 + (R_2{+}R_3)\\,I_2 = 0\\end{cases}`,
                eqBox, { displayMode: true, throwOnError: false });
        } else {
            eqBox.textContent = '(R1+R2)·I1 − R2·I2 = E ;  −R2·I1 + (R2+R3)·I2 = 0';
        }
    }

    ids.forEach(k => els[k].addEventListener('input', update));
    update();
}
