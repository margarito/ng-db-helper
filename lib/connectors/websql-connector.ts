/// <reference path="./typings/websql.d.ts"/>
import { QueryError } from '../core/errors/query.error';
import { SQLiteTransaction } from '@ionic-native/sqlite';
import { DbQuery } from '../core/models/db-query.model';
import { WebsqlConnectorConfiguration } from './configurations/websql-connector-configuration';
import { Observable, Observer } from 'rxjs/Rx';
import { DataModel } from '../core/models/data-model.model';
import { QueryConnector } from '../core/interfaces/query-connector.interface';
import { ModelMigration } from '../core/interfaces/model-migration.interface';
import { QueryResult } from '../core/interfaces/query-result.interface';

export class WebsqlConnector implements QueryConnector, ModelMigration {
    private dbValue: Database;
    private get db(): Database {
        if (!this.dbValue) {
            this.dbValue = window.openDatabase(this.config.dbName, '', this.config.dbName, 10000000);
        }
        return this.dbValue;
    };

    constructor(private config: WebsqlConnectorConfiguration) {}

    /**
     * query
     */
    query(dbQuery: DbQuery): Observable<QueryResult<any>> {
        return Observable.create((observer: Observer<QueryResult<any>>) => {
            let q = dbQuery.query;
            if (dbQuery.type === 'SELECT' &&
                dbQuery.query.toUpperCase().indexOf('LIMIT') < 0 &&
                dbQuery.query.toUpperCase().indexOf('OFFSET') < 0) {
                    const offset = dbQuery.page * dbQuery.size;
                    q += ' LIMIT ' + (offset + dbQuery.size);
                    q += ' OFFSET ' + offset;
            }
            if (this.db) {
                this.db.transaction((transaction: SQLiteTransaction) => {
                    transaction.executeSql(q, dbQuery.params, (tr: SQLTransaction, result: SQLResultSet) => {
                        observer.next(result);
                        observer.complete();
                    }, (tr, err) => observer.error(new QueryError(err.message, q, dbQuery.params ? dbQuery.params.join(', ') : null)));
                }, (err) => observer.error(new QueryError(String(err.message), q, dbQuery.params ? dbQuery.params.join(', ') : null)));
            } else {
                observer.error(new QueryError('no database opened', q, dbQuery.params ? dbQuery.params.join(', ') : null));
            }
        });
    }

    /**
     * isReady
     */
    isReady(): boolean {
        return true;
    }

    /**
     * onReady
     */
    onReady(): Observable<boolean> {
        return Observable.create((observer: Observer<boolean>) => {
            observer.next(true);
            observer.complete();
        });
    }

    /**
     * getDbVersion
     */
    getDbVersion(): Observable<string> {
        return Observable.create((observer: Observer<string>) => {
            if (this.db) {
                observer.next(String(this.db.version));
            } else {
                observer.next(null);
            }
            observer.complete();
        });
    }

    initModel(dataModel: DataModel): Observable<any> {
        return this.config.initDataModel(dataModel, this.db);
    }

    upgradeModel(dataModel: DataModel, oldVersion: string): Observable<any> {
        return this.config.initDataModel(dataModel, this.db);
    }
}
