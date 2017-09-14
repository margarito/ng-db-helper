import { QueryError } from 'ts-db-helper';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Create } from 'ts-db-helper';
import { DataModel } from 'ts-db-helper';

import 'rxjs/add/observable/concat';

/**
 * @public
 * @class `CordovaSqliteConnectorConfiguration`
 *
 * @description
 * This class is a default configuration for connector {@link CordovaSqliteConnector}
 * it provides config key to add copy informations.
 *   - `dbName` : filename for database on target device, default value is `'database.db'`,
 *   - `doCopyDb` : flag to create database by copy, other configurations provides source informations, default value is false,
 *   - `sourceDbName` : the db name to copy from the project files, default value is `'www/assets/'`,
 *   - `sourceDbPath` : path to the db relative to the root of the project, default is `'database.db'`,
 *   - `location` : see `cordova-sqlite-storage` location parameter on database open method, default is `'location'`,
 *   - `initDatamodel` : function called on model initialization, if you add your custom logic, part of previous configuration will
 *      not be needed, method signature: `(dataModel: DataModel, db: SQLiteDatabase) => Observable<any>`
 *   - `upgradeDataModel` : this function is the function to replace to manage model migration, see the method signature:
 *      `(dataModel: DataModel, db: SQLiteDatabase, oldVarsion: number) => Observable<any>`. New data model share the new
 *      version number and old version is passed too. DataModel object is generated from annotation and the version putted from the
 *      configuration, all is here to write migration script.
 *
 * @example
 * ```typescript
 * const config = new CordovaSqliteConnectorConfiguration();
 * // configure db name on device
 * config.dbName = app.sqlite;
 * // configure the database to copy from
 * config.sourceDbName = db.sqlite;
 * // configure the path to the database
 * config.sourceDbPath = 'www/assets/db/';
 * // turn on db init by copy
 * config.doCopyDb = true;
 * // add config to connector
 * const connector = CordovaSqliteConnector(config);
 * // add your connector to module configuration
 *
 * ```
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class CordovaSqliteConnectorConfiguration {
    /**
     * @public
     * @property {string} dbName file name of the database on the device
     */
    public dbName = 'database.db';

    /**
     * @public
     * @property {string} sourceDbName file name of the database to copy on the device
     */
    public sourceDbName = this.dbName;

    /**
     * @public
     * @property {string} sourceDbPath file path of the database oto copy the device
     */
    public sourceDbPath = 'www/assets/';

    /**
     * @public
     * @property {string} location config for cordova-sqlite-storage (see cordova plugin documentation)
     */
    public location = 'default';

    /**
     * @public
     * @property {boolean} doCopyDb activate database initialisation by copy. if propert is false (default value)
     * database would be initialise by generated script using the datamodel generated with model annotations
     */
    public doCopyDb = false;

    /**
     * @public
     * @method initDataModel is called if database need to be initialized.
     * You can override this method if you need to add your logic
     *
     * @param {DataModel} dataModel     model generated be model annotations
     * @param {SQLiteDatabase} db       @see cordova-sqlite-storage
     *
     * @return {Observable<any>}        observable to subscribe during async operation
     */
    public initDataModel(dataModel: DataModel, db: any): Observable<any> {
        return this.createTables(dataModel, db, true);
    }

    /**
     * @public
     * @method upgradeDataModel is called if version should be upgrade.
     * Default script create new table but does not alter existing table.
     * You can override this method to add your own logic like alteration
     * and let script create new table by calling super.
     *
     * @param {DataModel} dataModel     model generated be model annotations
     * @param {SQLiteDatabase} db       @see cordova-sqlite-storage
     *
     * @return {Observable<any>}        observable to subscribe during async operation
     */
    public upgradeDataModel(dataModel: DataModel, db: any): Observable<any> {
        return this.createTables(dataModel, db);
    }

    /**
     * @private
     * @method createTables create table linked to datamodel (not table alteration)
     *
     * @param {DataModel} dataModel     model generated be model annotations
     * @param {SQLiteDatabase} db       @see cordova-sqlite-storage
     * @param {boolean} doDrop          drop table to allow recreation of database
     *
     * @return {Observable<any>}        observable to subscribe during async operation
     */
    private createTables(dataModel: DataModel, db: any, doDrop: boolean = false): Observable<any> {
        const queries = <string[]>[];
        for (const table of dataModel.tables) {
            queries.push(Create(table).build());
        }
        queries.push('PRAGMA user_version=' + dataModel.version);
        const createObservable = Observable.create((observer: Observer<any>) => {
            db.sqlBatch(queries, () => {
                observer.next(null);
                observer.complete();
            }, (err: any) => observer.error(new QueryError(err instanceof String ? err as string : JSON.stringify(err), '', '')));
        });
        if (doDrop) {
            return Observable.concat(this.dropTables(dataModel, db), createObservable);
        } else {
            return createObservable;
        }
    }

    /**
     * @private
     * @method createTables create table linked to datamodel (not table alteration)
     *
     * @param {DataModel} dataModel    model generated be model annotations
     * @param {SQLiteDatabase} db      @see cordova-sqlite-storage
     * @param {boolean} doDrop         drop table to allow recreation of database
     *
     * @return {Observable<any>}       observable to subscribe during async operation
     */
    private dropTables(dataModel: DataModel, db: any): Observable<any> {
        const queries = <string[]>[];
        for (const table of dataModel.tables) {
                queries.push('DROP TABLE IF EXISTS `' + table.name + '`');
        }
        return Observable.create((observer: Observer<any>) => {
            db.sqlBatch(queries, () => {
                observer.next(null);
                observer.complete();
            }, (err: any) => observer.error(new QueryError(err instanceof String ? err as string : JSON.stringify(err), '', '')));
        });
    }

}
