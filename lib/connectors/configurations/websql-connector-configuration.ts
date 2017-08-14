import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Create } from '../../core/models/queries/create.model';
import { DataModel } from '../../core/models/data-model.model';

import 'rxjs/add/observable/combineLatest';

/**
 * @class WebsqlConnectorConfiguration is a default configuration
 * for connector {@link WebsqlConnector}
 * This class provides config key to add copy informations.
 * 
 * @example
 * const config = new WebsqlConnectorConfiguration();
 * config.dbName = app.sqlite // configure db name on device
 * const connector = WebsqlConnector(config); // add config to connector
 * // add your connector to module configuration
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class WebsqlConnectorConfiguration {
    /**
     * @public
     * @property dbName file name of the database on the device
     */
    public dbName = 'database.db';

    /**
     * @public
     * @method initDataModel is called if database need to be initialized.
     * You can override this method if you need to add your logic
     * 
     * @param dataModel model generated be model annotations
     * @param db        SQLiteDatabase object, see cordova-sqlite-storage
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
     * @param dataModel model generated be model annotations
     * @param db        Database object, see websql documentation
     */
    public upgradeDataModel(dataModel: DataModel, db: any): Observable<any> {
        return this.createTables(dataModel, db);
    }

    /**
     * @private
     * @method createTables create table linked to datamodel (not table alteration)
     * 
     * @param dataModel model generated be model annotations
     * @param db        Database object, see websql documentation
     * @param doDrop    drop table to allow recreation of database
     */
    private createTables(dataModel: DataModel, db: any, doDrop: boolean = false): Observable<any> {
        return Observable.create((observer: Observer<any>) => {
            db.changeVersion(db.version, dataModel.version, (transaction: any) => {
                const observables = [];
                for (const table of dataModel.tables) {
                    if (doDrop) {
                        observables.push(this.dropTable(table.name, transaction));
                    }
                    observables.push(this.query(Create(table).build(), transaction));
                }
                Observable.combineLatest(observables).subscribe(() => {
                    observer.next(null);
                }, (err) => {
                    observer.error(err);
                }, () => {
                    observer.complete();
                });
            }, (err: any) => observer.error(err));
        });
    }

    /**
     * @private
     * @method dropTable drop table if exists
     * 
     * @param tableName     name of the table to drop
     * @param transaction SQLTransaction object, see websql documentation
     */
    private dropTable(tableName: string, transaction: any): Observable<any> {
        return this.query('DROP TABLE `' + tableName + '`', transaction);
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
                observer.error(err);
                observer.complete();
            });
        });
    }

}
