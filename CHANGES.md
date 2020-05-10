# CHANGES for @indexeddbshim/indexeddbshim

## ?

- Build: Update per latest devDeps.
- Build: Report compared to last build size
- Linting: As per latest ash-nazg
- Testing: Update tests to continue working per latest Node/jsdom
- Testing: Switch to cmrOutput-supporting `cypres-multi-reporters` fork (no need for Promise-based mocha-multi-reporters fork with proper implementation)
- Docs: Switch to mocha-badge-generator fork for proper async behavior
- Docs: Update license badges
- npm: Switch from deprecated rollup-plugin-babel to rollup/plugin-babel
- npm: Update devDeps (related to Babel, Rollup, ESLint, core-js, jsdom, license-badger, mocha/nyc, sinon, source-map-support, ws)

## 6.3.0

- Build: Fix per current fork
- Docs: Update coverage badge per latest coveradge
- Linting (ESLint): As per latest ash-nazg
- npm: Point to now merged `mocha-badge-generator`
- npm: Update devDeps

## 6.2.1

- Docs: Fix badges

## 6.2.0

- Fork from <https://github.com/axemclion/IndexedDBShim>.
- Project: Add Github Sponors button to be able to accept funding
- Project: Restore demo via Github Pages
- Fix (React Native/Webpack): Add CFG item `fs` (which the Node
    files automatically set) to allow removal of database files
    without disturbing non-Node environments that do their own
    special handling of `require` statements
- Fix (Android): Overcome apparent Android SQLite mishandling of
    boolean (convert to `Number`)
- Build: Drop Grunt in favor of equivalent npm scripts
- Testing (W3C): Update per latest wpt
- npm: Update devDeps/package-lock.json
