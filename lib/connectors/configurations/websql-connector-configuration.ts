import { Observable, Observer } from 'rxjs/Rx';
import { Create } from '../../core/models/queries/create.model';
import { DataModel } from '../../core/models/data-model.model';
import { CordovaSqliteConnector } from '../cordova-sqlite-connector';

export class WebsqlConnectorConfiguration {
    public dbName = 'database.db';
    public dbVersion = '';

    public cordovaSqliteConnector: CordovaSqliteConnector;

    public initDataModel(dataModel: DataModel, db: Database): Observable<any> {
        return this.createTables(dataModel, db, true);
    }

    public upgradeDataModel(dataModel: DataModel, db: Database): Observable<any> {
        return this.createTables(dataModel, db);
    }

    private createTables(dataModel: DataModel, db: Database, doDrop: boolean = false): Observable<any> {
        return Observable.create((observer: Observer<any>) => {
            db.changeVersion(db.version, dataModel.version, (transaction: SQLTransaction) => {
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
            }, (err) => observer.error(err));
        });
    }

    private dropTable(tableName: string, transaction: SQLTransaction): Observable<any> {
        return this.query('DROP TABLE `' + tableName + '`', transaction);
    }

    private query(query: string, transaction: SQLTransaction): Observable<any> {
        return Observable.create((observer: Observer<any>) => {
            transaction.executeSql(query, [], (result) => {
                observer.next(result);
                observer.complete();
            }, (tr, err) => {
                observer.error(err);
                observer.complete();
            });
        });
    }

}
