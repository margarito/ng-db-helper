import { Observable, Observer } from 'rxjs/Rx';
import { Create } from '../../core/models/queries/create.model';
import { DataModel } from '../../core/models/data-model.model';
import { CordovaSqliteConnector } from '../cordova-sqlite-connector';

export class CordovaSqliteConnectorConfiguration {
    public dbName = 'database.db';
    public sourceDbName = this.dbName;
    public sourceDbPath = 'www/assets/';
    public dbVersion = '';
    public location = 'default';
    public doCopyDb = false;

    public cordovaSqliteConnector: CordovaSqliteConnector;

    public initDataModel(dataModel: DataModel, db: SQLitePlugin.Database): Observable<any> {
        return this.createTables(dataModel, db, true);
    }

    public upgradeDataModel(dataModel: DataModel, db: SQLitePlugin.Database): Observable<any> {
        return this.createTables(dataModel, db);
    }

    private createTables(dataModel: DataModel, db: SQLitePlugin.Database, doDrop: boolean = false): Observable<any> {
        const queries = <[string]>[];
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
            }, (err) => observer.error(err));
        });
    }

}
