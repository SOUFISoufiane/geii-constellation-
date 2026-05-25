// ═══════════════════════════════════════════════════════════════════
//  STATE-SERIALIZER — Save/restore app state via URL (Base64-URL safe)
// ═══════════════════════════════════════════════════════════════════
//
//  Tier 1, Phase 1 (B): URL state sync foundation for the toolbox.
//  Encodes app state into the URL → every interesting view becomes a
//  shareable link. Decodes on boot to restore exact state.
//
//  Format: ?state=<base64url(JSON.stringify(state))>
//  Base64URL = standard Base64 with: + → -, / → _, no padding =
//
//  Why base64url (not raw JSON in URL)?
//  - Survives copy/paste, email clients, Markdown, Discord
//  - Compact (no %-escaping of {}, ", :, etc.)
//  - Round-trip safe for special chars (π, j, ±, accents)
// ═══════════════════════════════════════════════════════════════════

/**
 * Encode a JS object to a Base64URL string.
 * Handles UTF-8 correctly (π, j, é, etc.) via TextEncoder.
 */
export function encodeState(stateObj) {
    try {
        const json = JSON.stringify(stateObj);
        // UTF-8 → bytes → Base64 → URL-safe
        const bytes = new TextEncoder().encode(json);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
        console.error('[state-serializer] encode failed:', e);
        return '';
    }
}

/**
 * Decode a Base64URL string back to a JS object.
 * Returns null on any failure (corrupt hash, bad JSON, etc.) — never throws.
 */
export function decodeState(encoded) {
    if (!encoded || typeof encoded !== 'string') return null;
    try {
        // Restore URL-unsafe chars + padding
        let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        const pad = (4 - (base64.length % 4)) % 4;
        base64 += '='.repeat(pad);
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const json = new TextDecoder().decode(bytes);
        return JSON.parse(json);
    } catch (e) {
        console.error('[state-serializer] decode failed:', e);
        return null;
    }
}

/**
 * Build a shareable URL for the given state.
 * Strips existing query/hash from current location and appends ?state=...
 */
export function buildShareUrl(stateObj) {
    const encoded = encodeState(stateObj);
    if (!encoded) return window.location.href;
    const base = window.location.href.split('?')[0].split('#')[0];
    return `${base}?state=${encoded}`;
}

/**
 * Read state from the current URL.
 * Checks ?state= first, then legacy #state= form. Returns null if absent.
 */
export function readStateFromUrl() {
    try {
        const params = new URL(window.location.href).searchParams;
        const fromQuery = params.get('state');
        if (fromQuery) return decodeState(fromQuery);

        const hash = window.location.hash.slice(1);
        if (hash.startsWith('state=')) return decodeState(hash.slice(6));
    } catch (e) {
        console.error('[state-serializer] URL read failed:', e);
    }
    return null;
}

/**
 * Copy the current state's share URL to the clipboard.
 * Falls back to the legacy execCommand path if Clipboard API is blocked
 * (e.g. http:// without secure context).
 * Returns true on success, false otherwise.
 */
export async function copyShareUrl(stateObj) {
    const url = buildShareUrl(stateObj);
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
            return true;
        }
    } catch (e) {
        console.warn('[state-serializer] Clipboard API failed, falling back:', e);
    }
    try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    } catch (e) {
        console.error('[state-serializer] fallback copy failed:', e);
        return false;
    }
}

/**
 * Update the address bar with the current state WITHOUT reloading the page.
 * Useful for keeping the URL live as the user interacts (debounced).
 */
export function updateUrlSilently(stateObj) {
    try {
        const url = buildShareUrl(stateObj);
        history.replaceState(null, '', url);
    } catch (e) {
        console.error('[state-serializer] updateUrlSilently failed:', e);
    }
}
