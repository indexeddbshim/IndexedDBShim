/*globals GLOBAL*/

import nodeWebsql from 'websql';
GLOBAL.nodeWebsql = nodeWebsql;

import {IDBVersionChangeEvent} from './Event.js';
import IDBKeyRange from './IDBKeyRange.js';
import {IDBCursor, IDBCursorWithValue} from './IDBCursor.js';
import IDBObjectStore from './IDBObjectStore.js';
import IDBIndex from './IDBIndex.js';
import IDBTransaction from './IDBTransaction.js';
import IDBDatabase from './IDBDatabase.js';
import {IDBRequest, IDBOpenDBRequest} from './IDBRequest.js';
import {IDBFactory, shimIndexedDB} from './IDBFactory.js';

export {
    IDBVersionChangeEvent, IDBKeyRange, IDBCursor, IDBCursorWithValue,
    IDBObjectStore, IDBIndex, IDBTransaction, IDBDatabase, IDBRequest,
    IDBOpenDBRequest, IDBFactory, shimIndexedDB, shimIndexedDB as default
};
