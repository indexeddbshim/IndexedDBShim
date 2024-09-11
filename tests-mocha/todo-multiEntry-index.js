// Todo: Integrate into mocha tests

// import setGlobalVars from 'indexeddbshim/src/node-UnicodeIdentifiers.js';
// import './src/utils/server-globals.js';

// globalThis.window = globalThis;
// window.location = {search: '', pathname: '', href: ''};
// window.addEventListener = () => {
//   // No-op
// };
// setGlobalVars(window, {addNonIDBGlobals: true});

/** @type {IDBDatabase} */
let db;
indexedDB.deleteDatabase('MyDatabase');
const request = indexedDB.open('MyDatabase', 1);

request.addEventListener('upgradeneeded', function (e) {
  db = /** @type {EventTarget & {result: IDBDatabase}} */ (e.target)?.result;
  const objectStore = db.createObjectStore('books', {keyPath: 'id'});
  objectStore.createIndex('authorIndex', 'authors', {multiEntry: true});
});

request.addEventListener('success', function (e) {
  db = /** @type {EventTarget & {result: IDBDatabase}} */ (e.target)?.result;
  console.log('Database opened successfully');

  // Add some books after opening the DB
  addBook({id: 1, title: 'Book One', authors: [
    ['Last A', 'First A'],
    ['Last B', 'First B']
  ]});
  addBook({id: 2, title: 'Book Two', authors: [
    ['Last B', 'First B'],
    ['Last C', 'First C']
  ]});
  addBook({id: 3, title: 'Book Three', authors: [
    ['Last C', 'First C']
  ]});

  setTimeout(() => {
    getBooksByAuthor(['Last B', 'First B']);
  }, 1000);
});

request.addEventListener('error', function () {
  console.log('Error opening database:', request.error);
});

/**
 * @typedef {{
 *   id: number,
 *   title: string,
 *   authors: [string, string][]
 * }} Book
 */

/**
 * @param {Book} book
 * @returns {void}
 */
function addBook (book) {
  const transaction = db.transaction(['books'], 'readwrite');
  const objectStore = transaction.objectStore('books');
  const request = objectStore.add(book);
  request.onsuccess = function () {
    console.log('-------Book added successfully------');
  };
  request.addEventListener('error', function () {
    console.log('Error adding book:', request.error);
  });
}

/**
 * @param {[string, string]} author
 * @returns {void}
 */
function getBooksByAuthor (author) {
  const transaction = db.transaction(['books'], 'readonly');
  const objectStore = transaction.objectStore('books');
  const index = objectStore.index('authorIndex');
  const request = index.getAll(author);
  request.onsuccess = function (e) {
    const books = /** @type {EventTarget & {result: Book[]}} */ (
      e.target
    )?.result;

    console.log(`Books by ${author}:`, books);
  };
  request.addEventListener('error', function () {
    console.log('Error querying index:', request.error);
  });
}
