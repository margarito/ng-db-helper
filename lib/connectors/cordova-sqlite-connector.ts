import { QueryResultWrapper } from './query-result-wrapper';
import { UnsatisfiedRequirementError } from '../core/errors/unsatisfied-requirement.error';
import { ModelMigration } from '../core/interfaces/model-migration.interface';
import { QueryError } from '../core/errors/query.error';
import { CordovaSqliteConnectorConfiguration } from './configurations/cordova-sqlite-connector-configuration';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { QueryResult } from '../core/interfaces/query-result.interface';
import { DbQuery } from '../core/models/db-query.model';
import { DataModel } from '../core/models/structure/data-model.model';
import { QueryConnector } from '../core/interfaces/query-connector.interface';

/**
 * @class CordovaSqliteConnector is a default connector
 * for rdb module see {@link NgDbHelperModuleConfig}
 * This class provides config key to add copy informations.
 *
 * This default connector allow query to database provided with cordova-sqlite-storage
 * use {@link CordovaSqliteConnectorConfiguration} to override default migrations logics.
 *
 * To understand QueryConnectors or ModelMigrations see respectively {@link QueryConnectors},
 * {@link ModelMigrations} and configuration default script configuration
 *
 * Requirements: cordova, cordova-plugin-file, cordova-sqlite-storage
 *
 * @example
 * ```typescript
 * const connectorConfig = new CordovaSqliteConnectorConfiguration();
 * // configure db name on device
 * connectorConfig.dbName = app.sqlite;
 * // add config to connector
 * const connector = CordovaSqliteConnector(connectorConfig);
 * // create module config
 * const config = new NgDbHelperModuleConfig();
 * config.queryConnector = connector;
 * config.modelMigration = connector;
 * config.version = '1';
 * // add config to module with forRoot method
 * ```
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class CordovaSqliteConnector implements QueryConnector, ModelMigration {
    /**
     * @private
     * @property ready, flag updated with connector state to indicate that connector can query
     */
    private ready = false;

    /**
     * @private
     * @property onReadyObserver, observer of registered listener on connector ready update
     */
    private onReadyObserver: Observer<boolean>;

    /**
     * @private
     * @property targetDir, target dir where database should be copied
     */
    private targetDir: any;

    /**
     * @private
     * @property dbValue, SQLiteDatabase provided by cordova-sqlite-storage
     */
    private dbValue: any;

    /**
     * @private
     * @property db, getter that open database on demand
     */
    private get db(): any {
        if (!this.dbValue) {
            this.dbValue = (window as {[index: string]: any})
                .sqlitePlugin.openDatabase({name: this.config.dbName, location: this.config.location});
        }
        return this.dbValue;
    }

    /**
     * @constructor
     * @throws UnsatisfiedRequirementError, thrown if cordova is missing
     * connector start logic after 'deviceready' signal firing.
     *
     * @param config    configuration of the connector, see {@link CordovaSqliteConnectorConfiguration}
     *                  and connector documentation header.
     */
    public constructor(private config: CordovaSqliteConnectorConfiguration) {
        if (!(window as {[index: string]: any}).cordova) {
            throw(new UnsatisfiedRequirementError('You use cordova connector but cordova is not present !'));
        }
        document.addEventListener('deviceready', () => {
            if (this.checkRequirements()) {
                this.ready = true;
            } else {
                // requirements is missing, module could not be ready
                this.ready = false;
            }

            // callback onReady subscribers
            if (this.onReadyObserver) {
                this.onReadyObserver.next(this.ready);
                this.onReadyObserver.complete();
            }
        });
    }

    /**
     * @private
     * @method checkRequirements
     * @throws UnsatisfiedRequirementError, log error if cordova-plugin-file or cordova-sqlite-storage is missing
     */
    private checkRequirements() {
        let isRequirementVerified = true;
        if (!(window as {[index: string]: any}).resolveLocalFileSystemURL) {
            const err =
              new UnsatisfiedRequirementError('CordovaSqliteConnector needs cordova-plugin-file !');
            console.error(err);
            isRequirementVerified = false;
        }

        if (!(window as {[index: string]: any}).sqlitePlugin) {
            const err =
              new UnsatisfiedRequirementError('CordovaSqliteConnector needs cordova-sqlite-storage !');
            console.error(err);
            isRequirementVerified = false;
        }

        return isRequirementVerified;
    }

    /**
     * @public
     * @method query connector method to fire query
     *
     * @param dbQuery   DbQuery object containing query and query params.
     *                  see {@link DbQuery}
     *
     * @return          Obsevable   passing {@link QueryResult<any>} on query success
     *                              passing {@link QueryError} on query error
     */
    public query(dbQuery: DbQuery): Observable<QueryResult<any>> {
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
                    observer.next(new QueryResultWrapper(results));
                    observer.complete();
                }, (err: any) => observer.error(new QueryError(err.message, q, dbQuery.params ? dbQuery.params.join(', ') : '')));
            } else {
                observer.error(new QueryError('no database opened', q, dbQuery.params ? dbQuery.params.join(', ') : ''));
            }
        });
    }

    public queryBatch(dbQuries: DbQuery[]): Observable<QueryResult<any>> {
        const queries = <[string, any[]][]>[];
        for (const dbQuery of dbQuries) {
            queries.push([dbQuery.query, dbQuery.params]);
        }
        return Observable.create((observer: Observer<QueryResult<any>>) => {
            if (this.db) {
                this.db.sqlBatch(queries, (results: any) => {
                    observer.next(new QueryResultWrapper(results));
                    observer.complete();
                }, (err: any) => observer.error(new QueryError(err.message, '', '')));
            } else {
                observer.error(new QueryError('no database opened', '', ''));
            }
        });
    }

    /**
     * @public
     * @method isReady to check if module is ready, if not, caller should
     * subscribe to {@link CordovaSqliteConnector.onReady}
     *
     * @return should be true if connector can query else false
     */
    public isReady(): boolean {
        return this.ready;
    }

    /**
     * @public
     * @method onReady should be subscribed if connector is not ready
     * if connector is ready, observable is immediatly called, else all check will
     * be done after 'deviceready' signal
     *
     * @return Observable   passing true if connector is ready
     *                      passing false if connector will never be ready
     */
    public onReady(): Observable<boolean> {
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
     * @public
     * @method getDbVersion called to check db version, should be called only if connector
     * is ready.
     *
     * @return Observable   passing string version after version is checked
     */
    public getDbVersion(): Observable<string> {
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

    /**
     * @private
     * @method isDbCreated is private method to check if db is created before copy
     *
     * @return Observable   passing true if db file is present
     *                      passing false if db file is missing
     */
    private isDbCreated(): Observable<boolean> {
        let targetDirName = (window as {[index: string]: any}).cordova.file.dataDirectory;
        if ((window as {[index: string]: any}).device.platform === 'Android') {
            targetDirName = (window as {[index: string]: any}).cordova.file.applicationStorageDirectory + 'databases/';
            console.log('platform is android');
            console.log('targetDirName: ' + targetDirName);
        }

        return Observable.create((observer: Observer<boolean>) => {
            const onTargetDirResolved = (targetDir: any) => {
                this.targetDir = targetDir;
                targetDir.getFile(this.config.dbName, {}, () => {
                    this.dbValue = (window as {[index: string]: any}).sqlitePlugin
                        .openDatabase({name: this.config.dbName, location: this.config.location});
                    observer.next(true);
                    observer.complete();
                }, () => {
                    observer.next(false);
                    observer.complete();
                });
            };
            (window as {[index: string]: any}).resolveLocalFileSystemURL(targetDirName, onTargetDirResolved, (err: any) => {
                if ((window as {[index: string]: any}).device.platform === 'Android') {
                    (window as {[index: string]: any})
                        .resolveLocalFileSystemURL((window as {[index: string]: any}).cordova.file.applicationStorageDirectory,
                            (dir: any) => {
                                dir.getDirectory('databases', {create : true},
                                    (entry: any) => onTargetDirResolved(entry), (error: any) => observer.error(error));
                            }, (error: any) => observer.error(error));
                } else {
                    observer.error(err);
                }
            });
        });
    }

    /**
     * @public
     * @method initModel is implemented method from ModelMigration, see {@link ModelMigration} to understand usage.
     * {@link CordovaSqliteConnectorConfiguration.doCopyDb} is checked:
     *      - if true datamodel is initialized by copy or using config
     *      - if false {@link CordovaSqliteConnectorConfiguration.initDataModel} is called
     *
     * @param dataModel {@link DataModel} generated with model annotations
     *
     * @return Observable resolved on initModel finish
     */
    public initModel(dataModel: DataModel): Observable<any> {
        if (this.config.doCopyDb) {
            const sourceFileName = (window as {[index: string]: any}).cordova.file.applicationDirectory +
                this.config.sourceDbPath + this.config.sourceDbName;
            return Observable.create((observer: Observer<any>) => {
                this.isDbCreated().subscribe((isCreated: boolean) => {
                    if (isCreated) {
                        observer.next(null);
                        observer.complete();
                    } else {
                         (window as {[index: string]: any}).resolveLocalFileSystemURL(sourceFileName, (sourceFile: any) => {
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

    /**
     * @public
     * @method upgradeModel is implemented method from ModelMigration, see {@link ModelMigration} to understand usage.
     * directly call {@link CordovaSqliteConnectorConfiguration.upgradeDataModel}
     *
     * @param dataModel     {@link DataModel} generated with model annotations
     * @param oldVersion    old model version
     *
     * @return Observable resolved on upgradeModel finish
     */
    public upgradeModel(dataModel: DataModel, oldVersion: string): Observable<any> {
        return this.config.upgradeDataModel(dataModel, this.db);
    }
}
