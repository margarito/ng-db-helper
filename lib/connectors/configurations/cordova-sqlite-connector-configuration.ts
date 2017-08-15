import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Create } from '../../core/models/queries/create.model';
import { DataModel } from '../../core/models/data-model.model';

/**
 * @class CordovaSqliteConnectorConfiguration is a default configuration
 * for connector {@link CordovaSqliteConnector}
 * This class provides config key to add copy informations.
 * 
 * @example
 * 
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
 * @Since   0.1
 */
export class CordovaSqliteConnectorConfiguration {
    /**
     * @public
     * @property dbName file name of the database on the device
     */
    public dbName = 'database.db';

    /**
     * @public
     * @property sourceDbName file name of the database to copy on the device
     */
    public sourceDbName = this.dbName;

    /**
     * @public
     * @property sourceDbPath file path of the database oto copy the device
     */
    public sourceDbPath = 'www/assets/';

    /**
     * @public
     * @property location config for cordova-sqlite-storage (see cordova plugin documentation)
     */
    public location = 'default';

    /**
     * @public
     * @property doCopyDb activate database initialisation by copy. if propert is false (default value)
     * database would be initialise by generated script using the datamodel generated with model annotations
     */
    public doCopyDb = false;

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
     * @param db        SQLiteDatabase object, see cordova-sqlite-storage
     */
    public upgradeDataModel(dataModel: DataModel, db: any): Observable<any> {
        return this.createTables(dataModel, db);
    }

    /**
     * @private
     * @method createTables create table linked to datamodel (not table alteration)
     * 
     * @param dataModel model generated be model annotations
     * @param db        SQLiteDatabase object, see cordova-sqlite-storage
     * @param doDrop    drop table to allow recreation of database
     */
    private createTables(dataModel: DataModel, db: any, doDrop: boolean = false): Observable<any> {
        const queries = <string[]>[];
        for (const table of dataModel.tables) {
            if (doDrop) {
                queries.push('DROP TABLE IF EXISTS `' + table.name + '`');
            }
            queries.push(Create(table).build());
        }
        queries.push('PRAGMA user_version=' + dataModel.version);
        return Observable.create((observer: Observer<any>) => {
            db.sqlBatch(queries, () => {
                observer.next(null);
                observer.complete();
            }, (err: any) => observer.error(err));
        });
    }

}
