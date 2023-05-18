declare var shimIndexedDB: import('../src/IDBFactory.js').IDBFactory & WindowDatabase & {
    __useShim: () => void
    __debug: (val: boolean) => void
    __setConfig: (prop: string, val: import('../src/CFG.js').ConfigValue) => void
    __getConfig: (prop: string) => import('../src/CFG.js').ConfigValue
    __setUnicodeIdentifiers: (cfg?: {
        UnicodeIDStart: string, UnicodeIDContinue: string
    }) => void
};
