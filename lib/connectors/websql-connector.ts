import { UnsatisfiedRequirementError } from '../core/errors/unsatisfied-requirement.error';
import { QueryError } from '../core/errors/query.error';
import { DbQuery } from '../core/models/db-query.model';
import { WebsqlConnectorConfiguration } from './configurations/websql-connector-configuration';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { DataModel } from '../core/models/data-model.model';
import { QueryConnector } from '../core/interfaces/query-connector.interface';
import { ModelMigration } from '../core/interfaces/model-migration.interface';
import { QueryResult } from '../core/interfaces/query-result.interface';

/**
 * @class WebsqlConnector is a default connector
 * for rdb module see {@link NgDbHelperModuleConfig}
 * This class provides config key to add copy informations.
 *
 * This default connector allow query to database provided with Websql
 * use {@link WebsqlConnectorConfiguration} to override default migrations logics.
 * See W3C specification and check browser support
 *
 * To understand QueryConnectors or ModelMigrations see respectively {@link QueryConnectors},
 * {@link ModelMigrations} and configuration default script configuration
 *
 * Requirements: Websql support by browser
 *
 * @example
 * ```typescript
 * const connectorConfig = new WebsqlConnectorConfiguration();
 * // configure db name on device
 * connectorConfig.dbName = app.sqlite;
 * // add config to connector
 * const connector = WebsqlConnector(connectorConfig);
 * // create module config
 * const config = new NgDbHelperModuleConfig();
 * config.queryConnector = connector;
 * config.modelMigration = connector;
 * config.version = '1';
 * // add config to module with forRoot method
 * ```
 *
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class WebsqlConnector implements QueryConnector, ModelMigration {
    /**
     * @private
     * @property ready, flag updated with connector state to indicate that connector can query
     */
    private ready = true;

    /**
     * @private
     * @property dbValue, Database provided by Websql
     */
    private dbValue: any;

    /**
     * @private
     * @property db, getter that open database on demand
     */
    private get db(): any {
        if (!this.dbValue) {
            this.dbValue = (window as {[index: string]: any}).openDatabase(this.config.dbName, '', this.config.dbName, 10000000);
        }
        return this.dbValue;
    };

    /**
     * @constructor
     * @throws UnsatisfiedRequirementError, thrown if Websql is not supported
     * connector start logic after 'deviceready' signal firing.
     *
     * @param config    configuration of the connector, see {@link CordovaSqliteConnectorConfiguration}
     *                  and connector documentation header.
     */
    public constructor(private config: WebsqlConnectorConfiguration) {
        this.ready = !!(window as {[index: string]: any}).openDatabase;
        if (!this.ready) {
            throw(new UnsatisfiedRequirementError('Your browser does not support websql !'))
        }
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
                this.db.transaction((transaction: any) => {
                    transaction.executeSql(q, dbQuery.params, (tr: any, result: any) => {
                        observer.next(result);
                        observer.complete();
                    }, (tr: any, err: any) => {
                        observer.error(new QueryError(err.message, q, dbQuery.params ? dbQuery.params.join(', ') : ''));
                    });
                }, (err: any) => observer.error(new QueryError(String(err.message), q, dbQuery.params ? dbQuery.params.join(', ') : '')));
            } else {
                observer.error(new QueryError('no database opened', q, dbQuery.params ? dbQuery.params.join(', ') : ''));
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
    isReady(): boolean {
        return this.ready;
    }

    /**
     * @public
     * @method onReady no async check is done, capability is checked in constructor.
     *
     * @return Observable   passing true if connector is ready
     *                      passing false if connector will never be ready
     */
    onReady(): Observable<boolean> {
        return Observable.create((observer: Observer<boolean>) => {
            observer.next(this.ready);
            observer.complete();
        });
    }

    /**
     * @public
     * @method getDbVersion called to check db version, should be called only if connector
     * is ready.
     *
     * @return Observable   passing string version after version is checked
     */
    getDbVersion(): Observable<string> {
        return Observable.create((observer: Observer<string>) => {
            if (this.db) {
                observer.next(String(this.db.version));
            } else {
                observer.next('');
            }
            observer.complete();
        });
    }

    /**
     * @public
     * @method initModel is implemented method from ModelMigration, see {@link ModelMigration} to understand usage.
     * {@link WebsqlConnectorConfiguration.initDataModel} is called
     *
     * @param dataModel {@link DataModel} generated with model annotations
     *
     * @return Observable resolved on initModel finish
     */
    initModel(dataModel: DataModel): Observable<any> {
        return this.config.initDataModel(dataModel, this.db);
    }

    /**
     * @public
     * @method upgradeModel is implemented method from ModelMigration, see {@link ModelMigration} to understand usage.
     * directly call {@link WebsqlConnectorConfiguration.upgradeDataModel}
     *
     * @param dataModel     {@link DataModel} generated with model annotations
     * @param oldVersion    old model version
     *
     * @return Observable resolved on upgradeModel finish
     */
    upgradeModel(dataModel: DataModel, oldVersion: string): Observable<any> {
        return this.config.initDataModel(dataModel, this.db);
    }
}
