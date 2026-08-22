export default nodeWebSQL;
export type SQLiteDatabaseInstance = {
    _db: any;
    exec: (typeof SQLiteDatabase)["prototype"]["exec"];
};
declare const nodeWebSQL: (...args: any[]) => import("websql-configurable/lib/websql/WebSQLDatabase.js").default;
import SQLiteDatabase from './nodeSQLiteDatabase.js';
//# sourceMappingURL=nodeWebSQL.d.ts.map