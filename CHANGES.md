# CHANGES for indexeddbshim/indexeddbshim

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
