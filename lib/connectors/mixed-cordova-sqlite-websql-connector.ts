import { CordovaSqliteConnector } from './cordova-sqlite-connector';
import { WebsqlConnector } from './websql-connector';
import { WebsqlConnectorConfiguration } from './configurations/websql-connector-configuration';
import { CordovaSqliteConnectorConfiguration } from './configurations/cordova-sqlite-connector-configuration';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { QueryResult } from '../core/interfaces/query-result.interface';
import { DbQuery } from '../core/models/db-query.model';
import { ModelMigration } from '../core/interfaces/model-migration.interface';
import { QueryConnector } from '../core/interfaces/query-connector.interface';
import { DataModel } from '../core/models/data-model.model';
import { UnsatisfiedRequirementError } from '../core/errors/unsatisfied-requirement.error';

/**
 * @class MixedCordovaSqliteWebsqlConnector is a default connector
 * for rdb module see {@link NgDbHelperModuleConfiguration}
 * This class provides config key to add copy informations.
 * 
 * This default connector allow query to database provided with cordova-sqlite-storage or Websql
 * use {@link CordovaSqliteConnectorConfiguration} to override default migrations logics.
 * 
 * To understand QueryConnectors or ModelMigrations see respectively {@link QueryConnectors},
 * {@link ModelMigrations} and configuration default script configuration
 * 
 * Requirements: if crodova is supported, cordova, cordova-plugin-device, cordova-plugin-file, cordova-sqlite-storage
 *               else Websql 
 * 
 * @example
 * ```typescript
 * const connectorConfig = new CordovaSqliteConnectorConfiguration();
 * // configure db name on device
 * connectorConfig.dbName = app.sqlite;
 * // add config to connector
 * const connector = MixedCordovaSqliteWebsqlConnector(connectorConfig);
 * // create module config
 * const config = new NgDbHelperModuleConfiguration(); 
 * config.queryConnector = connector;
 * config.modelMigration = connector;
 * config.version = '1';
 * // add config to module with forRoot method
 * ```
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class MixedCordovaSqliteWebsqlConnector implements QueryConnector, ModelMigration {
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
     * @property connector, real connector choose with logic based on platform
     */
    private connector: QueryConnector & ModelMigration;

    /**
     * @constructor
     * @throws UnsatisfiedRequirementError, thrown if cordova-plugin-device is missing and needed
     * connector start logic after 'deviceready' signal firing if cordova is present else directly start,
     * assuming that in this case platform should support Websql.
     * 
     * @param config    configuration of the connector, see {@link CordovaSqliteConnectorConfiguration}
     *                  and connector documentation header.
     */
    public constructor(private config: CordovaSqliteConnectorConfiguration) {
        if ((window as {[index:string]: any}).cordova) {
            document.addEventListener('deviceready', () => {
                if (!(window as {[index:string]: any}).device) {
                    throw(new UnsatisfiedRequirementError('Mixed connector need cordova-plugin-device to be installed'));
                }
                if ((window as {[index:string]: any}).device.platform === 'Browser') {
                    this.setupWebsqlConnector();
                } else {
                    this.setupCordovaConnector();
                }
            });
        } else {
            this.setupWebsqlConnector();
        }
    }

    /**
     * @private
     * @method setupWebsqlConnector
     */
    private setupWebsqlConnector() {
        const connectorConfig = new WebsqlConnectorConfiguration();
        connectorConfig.dbName = this.config.dbName;
        this.connector = new WebsqlConnector(connectorConfig);
        this.observeConnectorReady();
    }

    /**
     * @private
     * @method setupCordovaConnector
     */
    private setupCordovaConnector() {
        this.connector = new CordovaSqliteConnector(this.config);
        this.observeConnectorReady();
    }

    /**
     * @private
     * @method observeConnectorReady called on connector setted up
     */
    private observeConnectorReady() {
        this.connector.onReady().subscribe((ready: boolean) => {
            this.ready = ready;
            if (this.onReadyObserver) {
                this.onReadyObserver.next(this.ready);
                this.onReadyObserver.complete();
            }
        });
    }

    /**
     * @public
     * @method query connector method to fire query, query is delegate to real connector
     * 
     * @param dbQuery   DbQuery object containing query and query params.
     *                  see {@link DbQuery}
     * 
     * @return          Obsevable   passing {@link QueryResult<any>} on query success
     *                              passing {@link QueryError} on query error
     */
    public query(dbQuery: DbQuery): Observable<QueryResult<any>> {
        return this.connector.query(dbQuery);
    }

    /**
     * @public
     * @method isReady to check if module is ready, if not, caller should
     * subscribe to {@link MixedCordovaSqliteWebsqlConnector.onReady}
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
        return this.connector.getDbVersion();
    }

    /**
     * @public
     * @method initModel is implemented method from ModelMigration, see {@link ModelMigration} to understand usage.
     * method directly delegated to real connector
     * 
     * @param dataModel {@link DataModel} generated with model annotations
     * 
     * @return Observable resolved on initModel finish
     */
    public initModel(dataModel: DataModel): Observable<any> {
        return this.connector.initModel(dataModel);
    }

    /**
     * @public
     * @method upgradeModel is implemented method from ModelMigration, see {@link ModelMigration} to understand usage.
     * method directly delegated to real connector
     * 
     * @param dataModel     {@link DataModel} generated with model annotations
     * @param oldVersion    old model version
     * 
     * @return Observable resolved on upgradeModel finish
     */
    public upgradeModel(dataModel: DataModel, oldVersion: string): Observable<any> {
        return this.connector.upgradeModel(dataModel, oldVersion);
    }
}
