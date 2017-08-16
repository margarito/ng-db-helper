import { NgDbHelperModuleConfig } from '../../ng-db-helper-module-config';
import { Query } from '@angular/core';
import { ModelMigration } from '../interfaces/model-migration.interface';
import { QueryError } from '../errors/query.error';
import { ModelManager } from './model-manager';
import { DbQuery } from '../models/db-query.model';
import { UnsatisfiedRequirementError } from '../errors/unsatisfied-requirement.error';
import { QueryConnector } from '../interfaces/query-connector.interface';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { QueryResult } from '../interfaces/query-result.interface';
import { PendingDbQuery } from '../models/pending-db-query.model';

/**
 * @private API
 * @class QueryManager, this class is a singleton manging query
 * This manager has not to be exposed, it is used to handle queries
 * with the connector. It stack it during connector is not ready and
 * release it when connector ca query
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class QueryManager {
    /**
     * @static
     * @private
     * @property instance, private reference to the model manager instance
     */
    private static instance = new QueryManager();

    /**
     * @private
     * @property pendingDbQueries stack of queries to fire when the
     * connector is ready
     */
    private pendingDbQueries = <PendingDbQuery[]>[];

    /**
     * @private
     * @property isReady flag that should pas to true only when
     * query can be sent
     */
    private isReady = false;

    /**
     * @private
     * @property isInitializationFailed flag to reject all queries
     * in case of connector activation failure
     */
    private isInitializationFailed = false;

    /**
     * @private
     * @property queryConnector query connector that handle queries
     * to real db
     */
    private queryConnector: QueryConnector | undefined;

    /**
     * @private
     * @property modelMigration that handle migration on version change
     */
    private modelMigration: ModelMigration | undefined;

    /**
     * @static
     * @public
     * @method init is a part of the private API, config is submitted to
     * pass connector, model migration and other config. see {@link NgDbHelperModuleConfig}
     * for more informations
     * 
     * @param config the module configuration with connector instance and model migration
     */
    public static init(config: NgDbHelperModuleConfig): QueryManager {
        const instance = QueryManager.getInstance();
        instance.queryConnector = config.queryConnector;
        instance.modelMigration = config.modelMigration;
        ModelManager.version = config.version;
        if (config.autoIncrementVersion && ModelManager.version) {
            // compute auto upgrade version
            ModelManager.version += '.' + ModelManager.getInstance().getModelCount();
        }
        instance.queryConnector.onReady().subscribe((ready: boolean) => {
            if (ready) {
                instance.onQueryConnectorReady();
            } else {
                instance.onInitializationFailure(null);
            }
        }, instance.onInitializationFailure);
        return instance;
    }

    /**
     * @static
     * @public
     * @method getInstance to get the unique QueryManager instance
     * 
     * @return QueryManager instance
     */
    public static getInstance(): QueryManager {
        return QueryManager.instance;
    }

    /**
     * @private
     * @constructor private constructor to preserve from other instance creation
     */
    private constructor() {}

    /**
     * @private
     * @method onQueryConnectorReady is called when query connector is ready to
     * manage model migration then dequeuing  each pending queries
     */
    private onQueryConnectorReady() {
        if (this.queryConnector && this.modelMigration) {
            const modelMigration = this.modelMigration;
            let subcription = this.queryConnector.getDbVersion().subscribe((version: string) => {
                if (!version) {
                    const dataModel = ModelManager.getInstance().getDataModel();
                    dataModel.version = ModelManager.version;
                    subcription = modelMigration.initModel(dataModel).subscribe(() => {
                        this.dequeuePendingRequest();
                    }, (err: any) => this.onInitializationFailure(err));
                } else if (version !== ModelManager.version) {
                    const dataModel = ModelManager.getInstance().getDataModel();
                    dataModel.version = ModelManager.version;
                    subcription = modelMigration.upgradeModel(dataModel, version)
                        .subscribe(() => {
                            this.dequeuePendingRequest();
                        }, (err) => this.onInitializationFailure(err));
                } else {
                    this.dequeuePendingRequest();
                }
            }, (err) => this.onInitializationFailure(err));
        } else {
            throw(new UnsatisfiedRequirementError('ModelMigration or QueryConnector object is missing, check and fix NgDbHelperModule configuration !'))
        }
    }

    /**
     * @private
     * @method onInitializationFailure is called on initilization failure to cancel
     * all started queries and nexts
     * 
     * @param err the error return by the initialization failure 
     */
    private onInitializationFailure(err: any) {
        console.error(err);
        this.isInitializationFailed = true;
        this.dequeuePendingRequest();
    }

    /**
     * @private
     * @method dequeuePendingRequest is called to dequeue pending request
     */
    private dequeuePendingRequest() {
        while (this.pendingDbQueries.length) {
            const pendingDbQuery = this.pendingDbQueries.shift();
            if (pendingDbQuery) {
                this.executeQuery(pendingDbQuery.dbQuery, pendingDbQuery.observer);
            }
        }
        this.isReady = true;
    }

    /**
     * @public
     * @method query private API to start queries, it check if queries can be executed
     * If initialization failed, error is sent back. If connector is not ready, query will
     * be stack until connector ready signal
     * 
     * @param dbQuery   query information with params, see {@link DbQuery}
     * 
     * @return Observable   in case of success, {@link QueryResult<any>} is passed
     *                      in case of failure, {@link QueryError} is passed
     */
    public query(dbQuery: DbQuery): Observable<QueryResult<any>> {
        return Observable.create((observer: Observer<QueryResult<any>>) => {
            if (this.isReady) {
                this.executeQuery(dbQuery, observer);
            } else {
                this.pendingDbQueries.push(new PendingDbQuery(dbQuery, observer));
            }
        });
    }

    /**
     * @private
     * @method executeQuery should be called only when connector is ready
     * 
     * @param dbQuery   query information with params, see {@link DbQuery}
     * @param observer  observer to manage query callback
     * 
     * @return Observable   in case of success, {@link QueryResult<any>} is passed
     *                      in case of failure, {@link QueryError} is passed
     */
    private executeQuery(dbQuery: DbQuery, observer: Observer<QueryResult<any>>) {
        if (this.isInitializationFailed) {
            const error = new QueryError('query manager initialization did failed', dbQuery.query,
                dbQuery.params ? dbQuery.params.join(', ') : '');
            observer.error(error);
        } else {
            if (this.queryConnector) {
                this.queryConnector.query(dbQuery).subscribe((result: QueryResult<any>) => {
                    observer.next(result);
                    observer.complete();
                }, (err) => observer.error(err));
            } else {
                throw(new UnsatisfiedRequirementError('QueryConnector object is missing, check and fix NgDbHelperModule configuration !'))
            }
        }
    }
}
