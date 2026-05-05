/**
 * Type definitions for Greasemonkey/Tampermonkey API
 * These functions are provided by the userscript manager at runtime
 */

/**
 * Retrieves a value from userscript storage
 * @param key - Storage key
 * @param defaultValue - Value to return if key doesn't exist
 */
declare function GM_getValue<T>(key: string, defaultValue?: T): T;

/**
 * Stores a value in userscript storage
 * @param key - Storage key
 * @param value - Value to store (must be JSON-serializable)
 */
declare function GM_setValue<T>(key: string, value: T): void;

/**
 * Injects CSS styles into the page
 * @param css - CSS string to inject
 */
declare function GM_addStyle(css: string): void;

/**
 * The unwrapped page window (bypasses the userscript sandbox).
 * Required so values set in the page's DevTools console (e.g. `window.__OF_DEBUG_DISCOVERY = true`)
 * are visible to the userscript at runtime.
 */
declare const unsafeWindow: typeof globalThis & Record<string, unknown>;
