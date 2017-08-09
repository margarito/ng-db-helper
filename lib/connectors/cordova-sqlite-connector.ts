import { UnsatisfiedRequirementError } from '../core/errors/unsatisfied-requirement.error';
/// <reference path="./typings/cordova.d.ts"/>
/// <reference path="./typings/cordova-plugin-file.d.ts"/>
/// <reference path="./typings/cordova-sqlite-storage.d.ts"/>
/// <reference path="./typings/cordova-plugin-device.d.ts"/>

import { ModelMigration } from '../core/interfaces/model-migration.interface';
import { QueryError } from '../core/errors/query.error';
import { CordovaSqliteConnectorConfiguration } from './configurations/cordova-sqlite-connector-configuration';
import { Observable, Observer } from 'rxjs/Rx';
import { QueryResult } from '../core/interfaces/query-result.interface';
import { DbQuery } from '../core/models/db-query.model';
import { DataModel } from '../core/models/data-model.model';
import { QueryConnector } from '../core/interfaces/query-connector.interface';

export class CordovaSqliteConnector implements QueryConnector, ModelMigration {
    private ready = false;
    private onReadyObserver: Observer<boolean>;
    private targetDir: DirectoryEntry;
    private dbValue: SQLitePlugin.Database;
    private get db(): SQLitePlugin.Database {
        if (!this.dbValue) {
            this.dbValue = window.sqlitePlugin.openDatabase({name: this.config.dbName, location: this.config.location});
        }
        return this.dbValue;
    }

    constructor(private config: CordovaSqliteConnectorConfiguration) {
        if (!window.cordova) {
            throw(new UnsatisfiedRequirementError('You use cordova connector but cordova is not present !'));
        }
        document.addEventListener('deviceready', () => {
            this.ready = true;
            if (this.onReadyObserver) {
                this.onReadyObserver.next(this.ready);
                this.onReadyObserver.complete();
                this.onReadyObserver = null;
            }
        });
    }

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
                this.db.executeSql(q, dbQuery.params, (results: SQLitePlugin.Results) => {
                    observer.next(results);
                    observer.complete();
                }, (err) => observer.error(new QueryError(err.message, q, dbQuery.params ? dbQuery.params.join(', ') : null)));
            } else {
                observer.error(new QueryError('no database opened', q, dbQuery.params ? dbQuery.params.join(', ') : null));
            }
        });
    }

    /**
     * isReady
     */
    isReady(): boolean {
        return this.ready;
    }

    /**
     * onReady
     */
    onReady(): Observable<boolean> {
        return Observable.create((observer: Observer<boolean>) => {
            if (this.ready) {
                observer.next(this.ready);
                observer.complete();
            } else {
                this.onReadyObserver = observer;
            }
        });
    }

    /**
     * getDbVersion
     */
    getDbVersion(): Observable<string> {
        return Observable.create((observer: Observer<string>) => {
            if (this.db) {
                this.db.executeSql('PRAGMA user_version;', [], (results: SQLitePlugin.Results) => {
                    if (results.rows.length) {
                        observer.next(results.rows.item(0));
                    } else {
                        observer.next(null);
                    }
                    observer.complete();
                }, (err) => observer.error(err));
            } else {
                observer.next(null);
                observer.complete();
            }
        });
    }

    private isDbCreated(): Observable<boolean> {
        let targetDirName = cordova.file.dataDirectory;
        if (device.platform === 'Android') {
            targetDirName = cordova.file.applicationStorageDirectory + 'databases/';
            console.log('platform is android');
            console.log('targetDirName: ' + targetDirName);
        }

        return Observable.create((observer: Observer<boolean>) => {
            const onTargetDirResolved = (targetDir: any) => {
                this.targetDir = targetDir;
                targetDir.getFile(this.config.dbName, {}, () => {
                    this.dbValue = window.sqlitePlugin.openDatabase({name: this.config.dbName, location: this.config.location});
                    observer.next(true);
                    observer.complete();
                }, () => {
                    observer.next(false);
                    observer.complete();
                });
            };
            window.resolveLocalFileSystemURL(targetDirName, onTargetDirResolved, (err) => {
                if (device.platform === 'Android') {
                    window.resolveLocalFileSystemURL(cordova.file.applicationStorageDirectory, (dir) => {
                        (dir as DirectoryEntry).getDirectory('databases', {create : true},
                        (entry) => onTargetDirResolved(entry), (error: any) => observer.error(error));
                    }, (err) => observer.error(err));
                } else {
                    observer.error(err);
                }
            });
        });
    }

    initModel(dataModel: DataModel): Observable<any> {
        if (this.config.doCopyDb) {
            const sourceFileName = cordova.file.applicationDirectory + this.config.sourceDbPath + this.config.sourceDbName;
            Observable.create((observer: Observer<any>) => {
                this.isDbCreated().subscribe((isCreated: boolean) => {
                    if (isCreated) {
                        observer.next(null);
                        observer.complete();
                    } else {
                         window.resolveLocalFileSystemURL(sourceFileName, (sourceFile) => {
                            sourceFile.copyTo(this.targetDir, this.config.dbName, () => {
                                observer.next(null);
                                observer.complete();
                            }, (err) => observer.error(err));
                        }, (err) => observer.error(err));
                    }
                }, (err) => observer.error(err));
            });
        } else {
            return this.config.initDataModel(dataModel, this.db);
        }
    }

    upgradeModel(dataModel: DataModel, oldVersion: string): Observable<any> {
        return this.config.initDataModel(dataModel, this.db);
    }
}
