import { UnsatisfiedRequirementError } from '../core/errors/unsatisfied-requirement.error';
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
    private targetDir: any;
    private dbValue: any;
    private get db(): any {
        if (!this.dbValue) {
            this.dbValue = (window as {[index:string]: any}).sqlitePlugin.openDatabase({name: this.config.dbName, location: this.config.location});
        }
        return this.dbValue;
    }

    constructor(private config: CordovaSqliteConnectorConfiguration) {
        if (!(window as {[index:string]: any}).cordova) {
            throw(new UnsatisfiedRequirementError('You use cordova connector but cordova is not present !'));
        }
        document.addEventListener('deviceready', () => {
            if (this.checkRequirements()) {
                this.ready = true;
            } else {
                this.ready = false;
            }

            if (this.onReadyObserver) {
                this.onReadyObserver.next(this.ready);
                this.onReadyObserver.complete();
            }
        });
    }

    private checkRequirements() {
        let isRequirementVerified = true;
        if (!(window as {[index:string]: any}).resolveLocalFileSystemURL) {
            const err =
              new UnsatisfiedRequirementError('On device supporting cordova sqlite, cordova-plugin-file is mandatory !');
            console.error(err);
            isRequirementVerified = false;
        }

        if (!(window as {[index:string]: any}).sqlitePlugin) {
            const err =
              new UnsatisfiedRequirementError('On device supporting cordova sqlite, cordova-sqlite-storage is mandatory !');
            console.error(err);
            isRequirementVerified = false;
        }

        return isRequirementVerified;
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
                this.db.executeSql(q, dbQuery.params, (results: any) => {
                    observer.next(results);
                    observer.complete();
                }, (err: any) => observer.error(new QueryError(err.message, q, dbQuery.params ? dbQuery.params.join(', ') : '')));
            } else {
                observer.error(new QueryError('no database opened', q, dbQuery.params ? dbQuery.params.join(', ') : ''));
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
                this.db.executeSql('PRAGMA user_version;', [], (results: any) => {
                    if (results.rows.length) {
                        observer.next(results.rows.item(0));
                    } else {
                        observer.next('');
                    }
                    observer.complete();
                }, (err: any) => observer.error(err));
            } else {
                observer.next('');
                observer.complete();
            }
        });
    }

    private isDbCreated(): Observable<boolean> {
        let targetDirName = (window as {[index:string]: any}).cordova.file.dataDirectory;
        if ((window as {[index:string]: any}).device.platform === 'Android') {
            targetDirName = (window as {[index:string]: any}).cordova.file.applicationStorageDirectory + 'databases/';
            console.log('platform is android');
            console.log('targetDirName: ' + targetDirName);
        }

        return Observable.create((observer: Observer<boolean>) => {
            const onTargetDirResolved = (targetDir: any) => {
                this.targetDir = targetDir;
                targetDir.getFile(this.config.dbName, {}, () => {
                    this.dbValue = (window as {[index:string]: any}).sqlitePlugin.openDatabase({name: this.config.dbName, location: this.config.location});
                    observer.next(true);
                    observer.complete();
                }, () => {
                    observer.next(false);
                    observer.complete();
                });
            };
            (window as {[index:string]: any}).resolveLocalFileSystemURL(targetDirName, onTargetDirResolved, (err: any) => {
                if ((window as {[index:string]: any}).device.platform === 'Android') {
                    (window as {[index:string]: any}).resolveLocalFileSystemURL((window as {[index:string]: any}).cordova.file.applicationStorageDirectory, (dir: any) => {
                        dir.getDirectory('databases', {create : true},
                        (entry: any) => onTargetDirResolved(entry), (error: any) => observer.error(error));
                    }, (error: any) => observer.error(error));
                } else {
                    observer.error(err);
                }
            });
        });
    }

    initModel(dataModel: DataModel): Observable<any> {
        if (this.config.doCopyDb) {
            const sourceFileName = (window as {[index:string]: any}).cordova.file.applicationDirectory + this.config.sourceDbPath + this.config.sourceDbName;
            return Observable.create((observer: Observer<any>) => {
                this.isDbCreated().subscribe((isCreated: boolean) => {
                    if (isCreated) {
                        observer.next(null);
                        observer.complete();
                    } else {
                         (window as {[index:string]: any}).resolveLocalFileSystemURL(sourceFileName, (sourceFile: any) => {
                            sourceFile.copyTo(this.targetDir, this.config.dbName, () => {
                                observer.next(null);
                                observer.complete();
                            }, (err: any) => observer.error(err));
                        }, (err: any) => observer.error(err));
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
