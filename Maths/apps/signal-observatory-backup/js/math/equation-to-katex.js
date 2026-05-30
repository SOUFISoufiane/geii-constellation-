// ═══════════════════════════════════════════════════════════════════
//  EQUATION → LaTeX (KaTeX-friendly)
//
//  Walks the AST produced by equation-parser.js and emits a LaTeX
//  string. Heuristic — aims for readable, not canonical math.
//
//  Examples:
//    sin(2*pi*f*t)        → \sin(2\pi f\,t)
//    exp(-a*t)*cos(w*t)   → e^{-at}\cos(\omega t)
//    (a+b)/(c-d)          → \dfrac{a+b}{c-d}
//    t^2                  → t^{2}
//    a^(b+c)              → a^{b+c}
// ═══════════════════════════════════════════════════════════════════

// Pretty-name table for common variable letters
const VAR_LATEX = {
    'pi': '\\pi',
    'omega': '\\omega', 'w': '\\omega',
    'theta': '\\theta',
    'alpha': '\\alpha',
    'beta':  '\\beta',
    'gamma': '\\gamma',
    'lambda':'\\lambda',
    'mu':    '\\mu',
    'phi':   '\\varphi',
    'tau':   '\\tau',
    'sigma': '\\sigma',
    'delta': '\\delta',
    'rho':   '\\rho',
    'eta':   '\\eta',
    'epsilon':'\\varepsilon'
};

// Functions that get `\` prefix in LaTeX
const LATEX_FNS = new Set([
    'sin','cos','tan','asin','acos','atan','sinh','cosh','tanh',
    'log','ln','exp','sqrt','min','max'
]);

// Operator precedence (higher = binds tighter)
const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, 'unary': 3, '^': 4 };

function varLatex(name) {
    // Greek letters / multi-char names emit a `\command` token. KaTeX greedily
    // consumes following letters into that command (e.g. `\tau t` → `\taut`).
    // Wrap the command in {} to terminate it explicitly. Single ASCII letters
    // don't need wrapping.
    if (VAR_LATEX[name]) return `{${VAR_LATEX[name]}}`;
    if (name.length > 1) return `{\\mathit{${name}}}`;
    return name;
}

function constLatex(name) {
    if (name === 'pi') return '{\\pi}';        // wrapped so `2\pi t` doesn't break
    if (name === 'e')  return 'e';
    if (name === 'j')  return 'j';
    return name;
}

/**
 * Render a node. `parentPrec` is the precedence of the parent operator;
 * we add parens if our own precedence is lower.
 */
function render(node, parentPrec = 0) {
    if (!node) return '';
    switch (node.kind) {
        case 'num':
            // Don't add trailing .0 — render integers as integers
            return Number.isInteger(node.value)
                ? String(node.value)
                : trimFloat(node.value);

        case 'const':
            return constLatex(node.name);

        case 'var':
            return varLatex(node.name);

        case 'unary': {
            const inner = render(node.arg, PREC.unary);
            return node.op === '-' ? `-${inner}` : `+${inner}`;
        }

        case 'binary': {
            const myPrec = PREC[node.op];
            switch (node.op) {
                case '+':
                case '-': {
                    const out = `${render(node.left, myPrec)} ${node.op} ${render(node.right, myPrec)}`;
                    return wrap(out, myPrec, parentPrec);
                }
                case '*': {
                    // Prefer juxtaposition (no symbol) when both sides are atomic
                    const L = render(node.left, myPrec);
                    const R = render(node.right, myPrec);
                    const atomic = isAtomic(node.left) && isAtomic(node.right);
                    const sep = atomic ? ((needsThinSpace(node.left, node.right)) ? '\\,' : '') : ' \\cdot ';
                    return wrap(`${L}${sep}${R}`, myPrec, parentPrec);
                }
                case '/': {
                    // Use \dfrac for clarity
                    return `\\dfrac{${render(node.left, 0)}}{${render(node.right, 0)}}`;
                }
                case '^': {
                    const base = render(node.left, PREC['^']);
                    const exp  = render(node.right, 0);
                    // Wrap base if it's a binary/unary expression
                    const needsParensOnBase = node.left.kind === 'binary' || node.left.kind === 'unary';
                    return `${needsParensOnBase ? `(${base})` : base}^{${exp}}`;
                }
            }
            break;
        }

        case 'call': {
            const arg = render(node.args[0], 0);
            const fn  = node.fn;
            if (fn === 'sqrt') return `\\sqrt{${arg}}`;
            if (fn === 'abs')  return `\\left|${arg}\\right|`;
            if (fn === 'exp')  return `e^{${arg}}`;
            if (fn === 'sinc') return `\\operatorname{sinc}(${arg})`;
            if (fn === 'rect') return `\\operatorname{rect}(${arg})`;
            if (fn === 'tri')  return `\\operatorname{tri}(${arg})`;
            if (fn === 'step' || fn === 'heaviside') return `u(${arg})`;
            if (fn === 'sign') return `\\operatorname{sgn}(${arg})`;
            if (LATEX_FNS.has(fn)) return `\\${fn}\\!\\left(${arg}\\right)`;
            return `\\operatorname{${fn}}(${arg})`;
        }
    }
    return '';
}

function wrap(s, myPrec, parentPrec) {
    return myPrec < parentPrec ? `\\left(${s}\\right)` : s;
}

function isAtomic(node) {
    return node.kind === 'num' || node.kind === 'var' || node.kind === 'const' ||
           node.kind === 'call' || (node.kind === 'unary' && isAtomic(node.arg));
}

function needsThinSpace(left, right) {
    // Insert a thin space between two letters/vars so `f t` doesn't read as `ft`
    return (left.kind === 'var' || left.kind === 'const' || left.kind === 'call') &&
           (right.kind === 'var' || right.kind === 'const');
}

function trimFloat(v) {
    return parseFloat(v.toFixed(6)).toString();
}

// ─── Public API ────────────────────────────────────────────────────
/**
 * Convert a parsed AST (from equation-parser) into a KaTeX/LaTeX string.
 */
export function astToKatex(ast) {
    if (!ast) return '';
    return render(ast, 0);
}

/**
 * Convenience: parse-and-render. Returns `{ latex, error }`.
 */
export function equationToKatex(src, parseEquation) {
    try {
        const ast = parseEquation(src);
        return { latex: astToKatex(ast), error: null };
    } catch (e) {
        return { latex: '', error: e.message };
    }
}
