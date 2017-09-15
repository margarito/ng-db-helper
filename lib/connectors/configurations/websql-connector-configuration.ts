import { QueryError } from '../../ts-db-helper/index';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Create } from '../../ts-db-helper/index';
import { DataModel } from '../../ts-db-helper/index';

import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/concat';

/**
 * @class WebsqlConnectorConfiguration
 *
 * @description
 * This class is a default configuration for connector {@link WebsqlConnector}
 * It provides config key to add copy informations.
 *
 * @example
 * ```typescript
 * const config = new WebsqlConnectorConfiguration();
 * // configure db name on device
 * config.dbName = app.sqlite;
 * // add config to connector
 * const connector = WebsqlConnector(config);
 * // add your connector to module configuration
 * ```
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class WebsqlConnectorConfiguration {
    /**
     * @public
     * @property {string} dbName file name of the database on the device
     */
    public dbName = 'database.db';

    /**
     * @public
     * @method initDataModel is called if database need to be initialized.
     * You can override this method if you need to add your logic
     *
     * @param {DataModel} dataModel     model generated be model annotations
     * @param {Database} db             @see WebSQL
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
     * @param {Database} db             @see WebSQL
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
     * @param {Database} db             @see WebSQL
     * @param {boolean} doDrop          drop table to allow recreation of database
     *
     * @return {Observable<any>}        observable to subscribe during async operation
     */
    private createTables(dataModel: DataModel, db: any, doDrop: boolean = false): Observable<any> {
        let dbQuery: string;

        const createObservable = Observable.create((observer: Observer<any>) => {
            console.log(dataModel);
            db.changeVersion(db.version, dataModel.version, (transaction: any) => {
                const observables = [];
                for (const table of dataModel.tables) {
                    dbQuery = Create(table).build();
                    observables.push(this.query(dbQuery, transaction));
                    console.log(dbQuery);
                }
                Observable.combineLatest(observables).subscribe(() => {}, (err: any) => {
                    observer.error(new QueryError(err instanceof String ? err as string : JSON.stringify(err), '', ''));
                });
            }, (err: any) => {
                observer.error(new QueryError(err instanceof String ? err as string : JSON.stringify(err), '', ''))
            }, () => {
                observer.next(null);
                observer.complete();
            });
        });
        if (doDrop) {
            return Observable.concat(this.dropTables(dataModel, db), createObservable);
        } else {
            return createObservable;
        }
    }

    /**
     * @private
     * @method dropTables a simmple method to drop all table in the data model
     * @param {DataModel} dataModel     model generated be model annotations
     * @param {Database} db             @see WebSQL
     *
     * @return {Observable<any>}        observable to subscribe during async operation
     */
    private dropTables(dataModel: DataModel, db: any): Observable<any> {
        return Observable.create((observer: Observer<any>) => {
            db.transaction((transaction: any) => {
                const observables = [];
                for (const table of dataModel.tables) {
                    observables.push(this.dropTable(table.name, transaction));
                }
                Observable.combineLatest(observables).subscribe(() => {}, (err: any) => {
                    observer.error(new QueryError(err instanceof String ? err as string : JSON.stringify(err), '', ''));
                });
            }, (err: any) => {
                observer.error(new QueryError(err instanceof String ? err as string : JSON.stringify(err), '', ''))
            }, () => {
                observer.next(null);
                observer.complete();
            });
        });
    }

    /**
     * @private
     * @method dropTable drop table if exists
     *
     * @param {string} tableName            name of the table to drop
     * @param {SQLTransaction} transaction  @see WebSQL
     *
     * @return {Observable<any>}        observable to subscribe during async operation
     */
    private dropTable(tableName: string, transaction: any): Observable<any> {
        return this.query('DROP TABLE IF EXISTS `' + tableName + '`', transaction);
    }

    /**
     * @private
     * @method query fire sql query
     *
     * @param query         sql query
     * @param transaction   SQLTransaction object, see websql documentation
     */
    private query(query: string, transaction: any): Observable<any> {
        return Observable.create((observer: Observer<any>) => {
            transaction.executeSql(query, [], (result: any) => {
                observer.next(result);
                observer.complete();
            }, (tr: any, err: any) => {
                observer.error(new QueryError(err instanceof String ? err as string : JSON.stringify(err), query, ''));
                observer.complete();
            });
        });
    }

}
