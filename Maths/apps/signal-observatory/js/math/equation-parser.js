// ═══════════════════════════════════════════════════════════════════
//  EQUATION PARSER — tokenizer + Pratt parser + safe evaluator
//
//  Grammar (informal):
//    expr     ::= term (('+'|'-') term)*
//    term     ::= unary (('*'|'/') unary)*
//    unary    ::= ('+'|'-') unary | power
//    power    ::= primary ('^' unary)?                  (right-associative)
//    primary  ::= NUMBER | IDENT | FUNCALL | '(' expr ')'
//    FUNCALL  ::= IDENT '(' expr (',' expr)* ')'        (we use single-arg only)
//
//  Supported:
//    operators : + − * / ^
//    functions : sin cos tan asin acos atan sinh cosh tanh
//                exp log ln sqrt abs sign floor ceil round
//                sinc rect tri step heaviside
//    constants : pi (or π), e
//    variables : single ASCII letter not reserved above (a, b, f, g, w, etc.)
//    the time axis variable is `t` (mandatory in any meaningful equation)
//
//  No `eval`, no `new Function` — explicit AST walker. Untrusted input
//  is safe by construction.
// ═══════════════════════════════════════════════════════════════════

// ─── Token types ──────────────────────────────────────────────────
const TOK = {
    NUM: 'NUM', IDENT: 'IDENT',
    PLUS: '+', MINUS: '-', STAR: '*', SLASH: '/', CARET: '^',
    LPAREN: '(', RPAREN: ')', COMMA: ',', EOF: 'EOF'
};

const FUNCTIONS = new Set([
    'sin','cos','tan','sec','csc','cot','asin','acos','atan','sinh','cosh','tanh',
    'exp','log','ln','log10','log2','sqrt','cbrt','abs','sign','floor','ceil','round',
    'sinc','rect','tri','step','heaviside',
    'min','max','mod',
    // Complex-aware builtins (active when j appears in the equation)
    're','im','arg','mag','conj'
]);

// 'j' is the imaginary unit — treated as a constant whose value is {re:0,im:1}.
// 'i' is intentionally NOT recognized as imaginary (it's a common loop variable;
// engineering tradition is j for √−1).
const CONSTANTS = new Set(['pi','π','e','j']);

// Greek/multi-letter variable names that should be recognized as a SINGLE
// identifier rather than split into single characters by the greedy tokenizer.
// Without this, `tau` would parse as `t*a*u`, polluting params with `a` and `u`.
const MULTICHAR_VARS = new Set([
    'tau','omega','theta','alpha','beta','gamma','lambda','mu','nu','sigma',
    'phi','varphi','psi','rho','eta','epsilon','varepsilon','delta','zeta',
    'xi','chi','kappa','iota','omicron','upsilon',
    // Common engineering shortcuts
    'omega0','omegaC','omegaN','omegaD',
    'Q','K','Kp','Ki','Kd',
    'fc','f0','fs','fn','fd',
    'inf','infty'
]);
const RESERVED = new Set([...FUNCTIONS, ...CONSTANTS, ...MULTICHAR_VARS]);

// ─── Tokenizer ────────────────────────────────────────────────────
function tokenize(src) {
    const tokens = [];
    let i = 0;
    const N = src.length;

    while (i < N) {
        const c = src[i];

        // whitespace
        if (c === ' ' || c === '\t' || c === '\n') { i++; continue; }

        // number (int or float)
        if (/[0-9.]/.test(c)) {
            let j = i;
            while (j < N && /[0-9.]/.test(src[j])) j++;
            // optional scientific notation: 1.5e-3
            if (j < N && (src[j] === 'e' || src[j] === 'E')) {
                let k = j + 1;
                if (k < N && (src[k] === '+' || src[k] === '-')) k++;
                if (k < N && /[0-9]/.test(src[k])) {
                    while (k < N && /[0-9]/.test(src[k])) k++;
                    j = k;
                }
            }
            const text = src.slice(i, j);
            const value = parseFloat(text);
            if (!Number.isFinite(value)) {
                throw new Error(`Invalid number "${text}"`);
            }
            tokens.push({ type: TOK.NUM, value, text });
            i = j;
            continue;
        }

        // identifier: keyword like 'sin', 'pi', or a single-letter variable.
        // We greedily consume an alphabetic run, then split it into known
        // keywords/funcs + remaining single-letter variables. This lets
        // users type `2pi` → `2 * pi`, `sin(2*pi*f*t)` → fine, and
        // `2ab` → `2 * a * b` (implicit multiplication, handled at parse).
        if (/[a-zA-ZπΩωθαβγλμφ]/.test(c)) {
            let j = i;
            while (j < N && /[a-zA-ZπΩωθαβγλμφ_]/.test(src[j])) j++;
            const run = src.slice(i, j);

            // Try to split run into a sequence of {keyword|constant|single-letter}.
            // Strategy: at each position, try the longest keyword/constant prefix;
            // failing that, take a single character as a variable.
            let k = 0;
            while (k < run.length) {
                let matched = null;
                // Longest match against reserved names (lowercased)
                for (const name of RESERVED) {
                    if (run.slice(k, k + name.length).toLowerCase() === name) {
                        if (!matched || name.length > matched.length) matched = name;
                    }
                }
                if (matched) {
                    tokens.push({ type: TOK.IDENT, value: matched, text: matched });
                    k += matched.length;
                } else {
                    // single-char variable
                    tokens.push({ type: TOK.IDENT, value: run[k], text: run[k] });
                    k++;
                }
            }
            i = j;
            continue;
        }

        // operators / punctuation
        switch (c) {
            case '+': tokens.push({ type: TOK.PLUS,   text: c }); i++; continue;
            case '-': tokens.push({ type: TOK.MINUS,  text: c }); i++; continue;
            case '−': tokens.push({ type: TOK.MINUS,  text: '-' }); i++; continue;  // unicode minus
            case '*': tokens.push({ type: TOK.STAR,   text: c }); i++; continue;
            case '×': tokens.push({ type: TOK.STAR,   text: '*' }); i++; continue;  // unicode times
            case '·': tokens.push({ type: TOK.STAR,   text: '*' }); i++; continue;  // dot product
            case '/': tokens.push({ type: TOK.SLASH,  text: c }); i++; continue;
            case '÷': tokens.push({ type: TOK.SLASH,  text: '/' }); i++; continue;
            case '^': tokens.push({ type: TOK.CARET,  text: c }); i++; continue;
            case '(': tokens.push({ type: TOK.LPAREN, text: c }); i++; continue;
            case ')': tokens.push({ type: TOK.RPAREN, text: c }); i++; continue;
            case ',': tokens.push({ type: TOK.COMMA,  text: c }); i++; continue;
            default:
                throw new Error(`Unexpected character "${c}" at position ${i}`);
        }
    }

    tokens.push({ type: TOK.EOF, text: '' });
    return tokens;
}

// ─── Pratt parser ─────────────────────────────────────────────────
//
// AST node shapes:
//   { kind: 'num', value: number }
//   { kind: 'var', name: string }
//   { kind: 'const', name: 'pi'|'e' }
//   { kind: 'call', fn: string, args: [node, ...] }
//   { kind: 'unary', op: '-' | '+', arg: node }
//   { kind: 'binary', op: '+'|'-'|'*'|'/'|'^', left: node, right: node }

class Parser {
    constructor(tokens) {
        this.toks = tokens;
        this.i = 0;
    }
    peek(offset = 0) { return this.toks[this.i + offset]; }
    eat()            { return this.toks[this.i++]; }
    expect(type)     {
        const t = this.toks[this.i];
        if (t.type !== type) {
            throw new Error(`Expected ${type} but got ${t.type} ("${t.text}") at token ${this.i}`);
        }
        this.i++;
        return t;
    }

    parseExpr() {
        let node = this.parseTerm();
        while (this.peek().type === TOK.PLUS || this.peek().type === TOK.MINUS) {
            const op = this.eat().type === TOK.PLUS ? '+' : '-';
            const right = this.parseTerm();
            node = { kind: 'binary', op, left: node, right };
        }
        return node;
    }

    parseTerm() {
        let node = this.parseUnary();
        while (true) {
            const t = this.peek().type;
            if (t === TOK.STAR) {
                this.eat();
                node = { kind: 'binary', op: '*', left: node, right: this.parseUnary() };
            } else if (t === TOK.SLASH) {
                this.eat();
                node = { kind: 'binary', op: '/', left: node, right: this.parseUnary() };
            } else if (this.isImplicitMulFollows()) {
                // implicit multiplication: 2pi, 3t, 2(x+1), )(...
                node = { kind: 'binary', op: '*', left: node, right: this.parseUnary() };
            } else break;
        }
        return node;
    }

    isImplicitMulFollows() {
        // After a primary expression, if the next token starts a new primary
        // (number, identifier, or '('), treat as implicit multiplication.
        const prev = this.toks[this.i - 1]?.type;
        const next = this.peek().type;
        if (next !== TOK.NUM && next !== TOK.IDENT && next !== TOK.LPAREN) return false;
        if (prev !== TOK.NUM && prev !== TOK.IDENT && prev !== TOK.RPAREN) return false;
        return true;
    }

    parseUnary() {
        if (this.peek().type === TOK.PLUS)  { this.eat(); return { kind: 'unary', op: '+', arg: this.parseUnary() }; }
        if (this.peek().type === TOK.MINUS) { this.eat(); return { kind: 'unary', op: '-', arg: this.parseUnary() }; }
        return this.parsePower();
    }

    parsePower() {
        const base = this.parsePrimary();
        if (this.peek().type === TOK.CARET) {
            this.eat();
            const exp = this.parseUnary();  // right-associative
            return { kind: 'binary', op: '^', left: base, right: exp };
        }
        return base;
    }

    parsePrimary() {
        const t = this.peek();
        if (t.type === TOK.NUM) {
            this.eat();
            return { kind: 'num', value: t.value };
        }
        if (t.type === TOK.LPAREN) {
            this.eat();
            const inner = this.parseExpr();
            this.expect(TOK.RPAREN);
            return inner;
        }
        if (t.type === TOK.IDENT) {
            this.eat();
            const name = (t.value === 'π') ? 'pi' : t.value;
            // Function call?
            if (this.peek().type === TOK.LPAREN && FUNCTIONS.has(name.toLowerCase())) {
                this.eat();  // consume (
                const args = [this.parseExpr()];
                while (this.peek().type === TOK.COMMA) { this.eat(); args.push(this.parseExpr()); }
                this.expect(TOK.RPAREN);
                return { kind: 'call', fn: name.toLowerCase(), args };
            }
            if (CONSTANTS.has(name.toLowerCase())) {
                return { kind: 'const', name: name.toLowerCase() === 'π' ? 'pi' : name.toLowerCase() };
            }
            return { kind: 'var', name };
        }
        throw new Error(`Unexpected token "${t.text}" at position ${this.i}`);
    }
}

// ─── Evaluator (AST walker, safe — no eval) ───────────────────────
const TWO_PI = 2 * Math.PI;

function callFn(name, args) {
    const a = args[0];
    switch (name) {
        case 'sin':   return Math.sin(a);
        case 'cos':   return Math.cos(a);
        case 'tan':   return Math.tan(a);
        case 'sec':   return 1 / Math.cos(a);
        case 'csc':   return 1 / Math.sin(a);
        case 'cot':   return 1 / Math.tan(a);
        case 'asin':  return Math.asin(a);
        case 'acos':  return Math.acos(a);
        case 'atan':  return Math.atan(a);
        case 'sinh':  return Math.sinh(a);
        case 'cosh':  return Math.cosh(a);
        case 'tanh':  return Math.tanh(a);
        case 'exp':   return Math.exp(a);
        case 'log':   return Math.log(a);     // natural log
        case 'ln':    return Math.log(a);
        case 'log10': return Math.log10(a);
        case 'log2':  return Math.log2(a);
        case 'sqrt':  return Math.sqrt(a);
        case 'cbrt':  return Math.cbrt(a);
        case 'abs':   return Math.abs(a);
        case 'sign':  return Math.sign(a);
        case 'floor': return Math.floor(a);
        case 'ceil':  return Math.ceil(a);
        case 'round': return Math.round(a);
        case 'sinc':  return Math.abs(a) < 1e-9 ? 1 : Math.sin(Math.PI * a) / (Math.PI * a);
        case 'rect':  return Math.abs(a) <= 0.5 ? 1 : 0;
        case 'tri':   return Math.max(0, 1 - Math.abs(a));
        case 'step':  return a >= 0 ? 1 : 0;
        case 'heaviside': return a >= 0 ? 1 : 0;
        case 'min':   return Math.min(...args);
        case 'max':   return Math.max(...args);
        case 'mod':   return args[0] % args[1];
        default: throw new Error(`Unknown function "${name}"`);
    }
}

export function evalNode(node, scope) {
    switch (node.kind) {
        case 'num':    return node.value;
        case 'const':  return node.name === 'pi' ? Math.PI : Math.E;
        case 'var':    {
            const v = scope[node.name];
            return (v === undefined || v === null) ? 1 : v;
        }
        case 'unary':  {
            const x = evalNode(node.arg, scope);
            return node.op === '-' ? -x : x;
        }
        case 'binary': {
            const l = evalNode(node.left, scope);
            const r = evalNode(node.right, scope);
            switch (node.op) {
                case '+': return l + r;
                case '-': return l - r;
                case '*': return l * r;
                case '/': return l / r;
                case '^': return Math.pow(l, r);
            }
            throw new Error(`Unknown binary op "${node.op}"`);
        }
        case 'call': {
            const args = node.args.map(a => evalNode(a, scope));
            return callFn(node.fn, args);
        }
    }
    throw new Error(`Unknown node kind "${node.kind}"`);
}

// ─── Variable scan (auto-detect equation params) ──────────────────
export function collectVariables(node, out = new Set()) {
    if (!node) return out;
    if (node.kind === 'var')   out.add(node.name);
    if (node.kind === 'unary') collectVariables(node.arg, out);
    if (node.kind === 'binary'){ collectVariables(node.left, out); collectVariables(node.right, out); }
    if (node.kind === 'call')  node.args.forEach(a => collectVariables(a, out));
    return out;
}

/** Returns true if the AST references the imaginary unit `j`. */
export function usesImaginary(node) {
    if (!node) return false;
    if (node.kind === 'const')  return node.name === 'j';
    if (node.kind === 'unary')  return usesImaginary(node.arg);
    if (node.kind === 'binary') return usesImaginary(node.left) || usesImaginary(node.right);
    if (node.kind === 'call')   return node.args.some(usesImaginary);
    return false;
}

// ─── Complex-aware evaluator ──────────────────────────────────────
import * as C from './complex.js';

function callFnComplex(name, args) {
    const a = args[0];
    switch (name) {
        case 'sin':   return C.cSin(a);
        case 'cos':   return C.cCos(a);
        case 'tan':   return C.cTan(a);
        case 'sec':   return C.cSec(a);
        case 'csc':   return C.cCsc(a);
        case 'cot':   return C.cCot(a);
        case 'sinh':  return C.cSinh(a);
        case 'cosh':  return C.cCosh(a);
        case 'tanh':  return C.cTanh(a);
        case 'asin':  return C.cAsin(a);
        case 'acos':  return C.cAcos(a);
        case 'atan':  return C.cAtan(a);
        case 'exp':   return C.cExp(a);
        case 'log':
        case 'ln':    return C.cLog(a);
        case 'log10': return C.cLog10(a);
        case 'log2':  return C.cLog2(a);
        case 'sqrt':  return C.cSqrt(a);
        case 'cbrt':  return C.cCbrt(a);
        case 'abs':
        case 'mag':   return C.cMag(a);
        case 're':    return C.cRe(a);
        case 'im':    return C.cIm(a);
        case 'arg':   return C.cArg(a);
        case 'conj':  return C.cConj(a);
        case 'sign':  {
            const aa = C.c(a);
            const r = Math.hypot(aa.re, aa.im);
            return r === 0 ? C.ZERO : { re: aa.re / r, im: aa.im / r };
        }
        // Step-like functions are defined on real input — use Re(arg) as decision
        case 'step':
        case 'heaviside': return { re: C.c(a).re >= 0 ? 1 : 0, im: 0 };
        case 'rect':      return { re: Math.abs(C.c(a).re) <= 0.5 ? 1 : 0, im: 0 };
        case 'tri':       return { re: Math.max(0, 1 - Math.abs(C.c(a).re)), im: 0 };
        case 'sinc': {
            const ar = C.c(a).re;
            return { re: Math.abs(ar) < 1e-9 ? 1 : Math.sin(Math.PI*ar)/(Math.PI*ar), im: 0 };
        }
        case 'floor':     return { re: Math.floor(C.c(a).re), im: 0 };
        case 'ceil':      return { re: Math.ceil(C.c(a).re),  im: 0 };
        case 'round':     return { re: Math.round(C.c(a).re), im: 0 };
        case 'min': {
            const reals = args.map(arg => C.c(arg).re);
            return { re: Math.min(...reals), im: 0 };
        }
        case 'max': {
            const reals = args.map(arg => C.c(arg).re);
            return { re: Math.max(...reals), im: 0 };
        }
        case 'mod': {
            return { re: C.c(args[0]).re % C.c(args[1]).re, im: 0 };
        }
        default: throw new Error(`Unknown function "${name}"`);
    }
}

/** Walks the AST producing complex {re,im} values. */
export function evalNodeComplex(node, scope) {
    switch (node.kind) {
        case 'num':    return { re: node.value, im: 0 };
        case 'const':  {
            if (node.name === 'pi') return { re: Math.PI, im: 0 };
            if (node.name === 'e')  return { re: Math.E,  im: 0 };
            if (node.name === 'j')  return { re: 0, im: 1 };
            return { re: 0, im: 0 };
        }
        case 'var': {
            const v = scope[node.name];
            if (v === undefined || v === null) return { re: 1, im: 0 };
            return C.c(v);
        }
        case 'unary': {
            const x = evalNodeComplex(node.arg, scope);
            return node.op === '-' ? C.cNeg(x) : x;
        }
        case 'binary': {
            const l = evalNodeComplex(node.left, scope);
            const r = evalNodeComplex(node.right, scope);
            switch (node.op) {
                case '+': return C.cAdd(l, r);
                case '-': return C.cSub(l, r);
                case '*': return C.cMul(l, r);
                case '/': return C.cDiv(l, r);
                case '^': return C.cPow(l, r);
            }
            throw new Error(`Unknown binary op "${node.op}"`);
        }
        case 'call': {
            const args = node.args.map(a => evalNodeComplex(a, scope));
            return callFnComplex(node.fn, args);
        }
    }
    throw new Error(`Unknown node kind "${node.kind}"`);
}

// ─── Forgiving normalization ───────────────────────────────────────
//
// Real users type equations the way they'd write them on paper:
//   • Mixed Unicode operators (− × ÷ · ⋅), Greek letters, fancy quotes
//   • Forgotten closing parens (`2/w (sin(w)+1`)
//   • Numbers glued to functions or vars without `*` (`2sin(x)`, `3x`)
//   • Trailing operators while still typing (`sin(t) +`)
//   • Empty input (panel default)
//
// `forgivingNormalize` rewrites a sloppy expression into a strict-but-
// equivalent one, emits human-readable warnings about what changed,
// and is idempotent on already-clean input.
// ──────────────────────────────────────────────────────────────────

const UNICODE_MAP = {
    '−': '-', '–': '-', '—': '-',     // minus variants
    '×': '*', '·': '*', '⋅': '*', '∗': '*',
    '÷': '/', '⁄': '/',
    'π': 'pi',
    ' ': ' ', // NBSP
    '“': '', '”': '', '"': '',
    '‘': '', '’': '', "'": '',
    // Unicode superscripts → ^N
    '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4',
    '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9',
    // Common fractions
    '½': '(1/2)', '⅓': '(1/3)', '¼': '(1/4)', '¾': '(3/4)'
};

/**
 * Returns { src: normalizedString, warnings: string[] }.
 * The returned `src` should parse cleanly under the strict parser.
 */
export function forgivingNormalize(rawSrc) {
    const warnings = [];
    if (!rawSrc || !rawSrc.trim()) {
        return { src: '0', warnings: ['Équation vide → s(t) = 0'] };
    }

    // 1. Unicode normalization
    let s = rawSrc;
    for (const [bad, good] of Object.entries(UNICODE_MAP)) {
        s = s.split(bad).join(good);
    }

    // 2. Collapse whitespace
    s = s.replace(/\s+/g, ' ').trim();

    // 3. Strip trailing operators (user is still typing)
    const trailOps = /[+\-*/^.(]+$/;
    if (trailOps.test(s)) {
        const stripped = s.replace(trailOps, '');
        if (stripped !== s) {
            warnings.push(`Opérateur final ignoré : "${s.slice(stripped.length)}"`);
            s = stripped || '0';
        }
    }

    // 4. Balance parentheses
    let opens = 0, closes = 0;
    for (const c of s) { if (c === '(') opens++; else if (c === ')') closes++; }
    if (opens > closes) {
        const missing = opens - closes;
        s = s + ')'.repeat(missing);
        warnings.push(`${missing} parenthèse(s) fermante(s) ajoutée(s) automatiquement`);
    } else if (closes > opens) {
        // Strip excess ')' from the right
        let extra = closes - opens;
        let chars = s.split('');
        for (let i = chars.length - 1; i >= 0 && extra > 0; i--) {
            if (chars[i] === ')') { chars[i] = ''; extra--; }
        }
        s = chars.join('');
        warnings.push(`${closes - opens} parenthèse(s) en trop ignorée(s)`);
    }

    // 5. Insert implicit multiplication where two atomic tokens touch via
    //    whitespace. Examples:
    //       "2 sin(x)"   → "2*sin(x)"
    //       "w (a+b)"    → "w*(a+b)"
    //       "x y z"      → "x*y*z"
    //    Run the regex repeatedly because `String.replace` with `g` only
    //    matches non-overlapping windows; in `x y z` after the first pass
    //    we get `x*y z` and need another sweep to catch `y z`.
    {
        let prev;
        do { prev = s; s = s.replace(/([a-zA-Z0-9_)])\s+([a-zA-Z_(])/g, '$1*$2'); }
        while (s !== prev);
    }

    // 6. Glued implicit multiplication: number directly followed by letter
    //    or '('. The tokenizer already handles `2pi` and `2(x)`, but not all
    //    forms — make it explicit so warnings are clearer.
    s = s.replace(/(\d(?:\.\d+)?)([a-zA-Zπ_(])/g, '$1*$2');

    // 7. ')' immediately followed by alpha/number/'(' → ')*'
    s = s.replace(/\)([a-zA-Zπ0-9_(])/g, ')*$1');

    return { src: s, warnings };
}

// ─── Public API ────────────────────────────────────────────────────
/**
 * Parse a math expression string into an AST. Throws on syntax error.
 * Pass `{ strict: false }` (the default) for forgiving behaviour, or
 * `{ strict: true }` to skip normalization (useful for tests).
 *
 * Returns the AST directly (legacy contract); callers wanting warnings
 * should use `parseEquationWithWarnings` instead.
 */
export function parseEquation(src, opts = {}) {
    const strict = opts.strict === true;
    const norm = strict ? { src, warnings: [] } : forgivingNormalize(src);
    const tokens = tokenize(norm.src);
    const parser = new Parser(tokens);
    const ast = parser.parseExpr();
    if (parser.peek().type !== TOK.EOF) {
        throw new Error(`Token inattendu "${parser.peek().text}" en position ${parser.i}`);
    }
    return ast;
}

/**
 * Like parseEquation but also returns the normalized source and warnings.
 */
export function parseEquationWithWarnings(src, opts = {}) {
    const strict = opts.strict === true;
    const norm = strict ? { src, warnings: [] } : forgivingNormalize(src);
    try {
        const tokens = tokenize(norm.src);
        const parser = new Parser(tokens);
        const ast = parser.parseExpr();
        if (parser.peek().type !== TOK.EOF) {
            // Try once more: snip off trailing junk
            throw new Error(`Token inattendu "${parser.peek().text}"`);
        }
        return { ast, src: norm.src, warnings: norm.warnings, error: null };
    } catch (e) {
        return { ast: null, src: norm.src, warnings: norm.warnings, error: e.message };
    }
}

/**
 * Returns a hot evaluator function: `(t, params) => number`.
 * If the equation is invalid, returns a function that always returns 0
 * and exposes `.error` with the message.
 *
 * Forgiving by default — auto-balances parens, inserts implicit *,
 * normalizes Unicode operators, etc. `.warnings` lists each fix applied.
 */
/**
 * Build the eval scope. Caller passes the sweep variable as the first arg
 * (always named `t` here — the freq-domain path will call with f-values
 * substituted in for t, plus an `f` entry in params).
 *
 * ω = 2π·f is enforced whenever the caller-provided `f` is present and the
 * user has not explicitly supplied a value for `w` / `omega`.
 */
function bindScope(t, params) {
    const scope = { t, ...params };
    const f = scope.f;
    if (typeof f === 'number') {
        if (scope.w === undefined)     scope.w     = 2 * Math.PI * f;
        if (scope.omega === undefined) scope.omega = 2 * Math.PI * f;
        if (scope.x === undefined)     scope.x     = f; // x acts as freq sweep
    } else {
        if (scope.x === undefined)     scope.x     = t; // x acts as time sweep
    }
    return scope;
}

export function compileEquation(src) {
    const result = parseEquationWithWarnings(src);
    if (result.ast) {
        const ast = result.ast;
        const vars = [...collectVariables(ast)];
        const hasJ = usesImaginary(ast);

        // Reserved names that should NEVER appear in the user-tunable params:
        //  - t, f, n   : sweep / index variables (provided by caller)
        //  - omega, w  : auto-bound to 2πf (provided by caller)
        //  - x         : auto-bound to the main sweep variable (t or f)
        const RESERVED_VARS = new Set(['t', 'f', 'n', 'w', 'omega', 'x']);

        const fn = hasJ
            ? (t, params = {}) => {
                // Complex path. Always-bind ω = 2πf when both f and ω/w used.
                const scope = bindScope(t, params);
                const v = evalNodeComplex(ast, scope);
                // For time-domain plots we coerce to real (engineer convention)
                if (!Number.isFinite(v.re)) return 0;
                return v.re;
            }
            : (t, params = {}) => {
                const scope = bindScope(t, params);
                const v = evalNode(ast, scope);
                return Number.isFinite(v) ? v : 0;
            };

        // Complex-aware evaluator that returns {re,im}. Useful for the freq-domain
        // path which needs both parts to feed magnitude/phase plots.
        fn.evalComplex = (t, params = {}) => {
            const scope = bindScope(t, params);
            return evalNodeComplex(ast, scope);
        };

        fn.ast        = ast;
        fn.variables  = vars;
        fn.params     = vars.filter(v => !RESERVED_VARS.has(v));
        fn.source     = src;
        fn.normalized = result.src;
        fn.warnings   = result.warnings;
        fn.error      = null;
        fn.usesImag   = hasJ;
        return fn;
    }
    // Fallback (parser threw)
    {
        const fn = () => 0;
        fn.ast = null;
        fn.variables = [];
        fn.params = [];
        fn.source = src;
        fn.normalized = result.src;
        fn.warnings = result.warnings;
        fn.error = result.error;
        return fn;
    }
}
