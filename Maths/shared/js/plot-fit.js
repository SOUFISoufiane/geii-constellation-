// ═══════════════════════════════════════════════════════════════════
//  PLOT-FIT — robust Plotly sizing for flex layouts
// ═══════════════════════════════════════════════════════════════════
//  Why this exists
//  ---------------
//  The Tier-4 apps mount each plot into a `div#plot-x{width:100%;height:100%}`
//  that lives inside a flex column (`.stage > .plot-container`). When
//  `Plotly.react(..., {responsive:true})` runs before the flex chain has a
//  resolved pixel height, Plotly's autosize reads height 0 and bakes a
//  `.svg-container { height: 0 }`. The traces then render into a collapsed,
//  unpainted box — the plot looks blank even though the SVG paths exist.
//  `Plotly.Plots.resize()` does NOT recover from this because autosize keeps
//  re-reading the already-zeroed container.
//
//  The fix: never rely on autosize. Always hand Plotly an explicit pixel
//  `width`/`height` taken from the container's live client box, and re-apply
//  it whenever the container resizes (window resize OR tab becomes visible).
// ═══════════════════════════════════════════════════════════════════

const observed = new WeakSet();

/** Measure a plot container, falling back to its parent if it reports 0. */
function measure(el) {
    let w = el.clientWidth, h = el.clientHeight;
    // A display:none ancestor (inactive tab) reports 0 — walk up to the
    // nearest sized box so the first paint after activation is correct.
    let p = el.parentElement;
    while ((!w || !h) && p) {
        w = w || p.clientWidth;
        h = h || p.clientHeight;
        p = p.parentElement;
    }
    return { w, h };
}

/**
 * Drop-in replacement for `Plotly.react` that guarantees a sized plot.
 * Pass the SAME (id, data, layout, config) you would give Plotly.react.
 * The container is auto-observed so it stays sized on resize / tab-show.
 */
export function renderPlot(id, data, layout, config = {}) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) { console.warn(`[plot-fit] no element #${id}`); return; }

    const { w, h } = measure(el);
    const sizedLayout = { ...layout, width: w || undefined, height: h || undefined, autosize: false };
    // responsive:true would re-enable the broken autosize path — force it off.
    const sizedConfig = { ...config, responsive: false };

    Plotly.react(el, data, sizedLayout, sizedConfig);

    if (!observed.has(el)) {
        observed.add(el);
        const refit = () => {
            const m = measure(el);
            if (m.w && m.h) Plotly.relayout(el, { width: m.w, height: m.h });
        };
        // Window resize covers viewport changes; ResizeObserver covers the
        // container becoming visible (tab switch) or flex reflow.
        window.addEventListener('resize', refit);
        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(refit).observe(el.parentElement || el);
        }
    }
}
