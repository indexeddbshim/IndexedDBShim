export default __setGlobalVars;
/**
 * @param {typeof globalThis | Record<string, unknown>} [idb]
 * @param {Partial<import('./CFG.js').ConfigValues>} [initialConfig]
 * @returns {import('./setGlobalVars.js').ShimmedObject|Window}
 */
declare function __setGlobalVars(idb?: typeof globalThis | Record<string, unknown>, initialConfig?: Partial<import("./CFG.js").ConfigValues>): import("./setGlobalVars.js").ShimmedObject | Window;
//# sourceMappingURL=node-UnicodeIdentifiers.d.ts.map