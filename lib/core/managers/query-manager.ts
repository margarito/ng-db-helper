import { toArray } from 'rxjs/operator/toArray';
import { Subject } from 'rxjs/Subject';
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

import 'rxjs/add/operator/share';

/**
 * @private API
 * @class QueryManager, this class is a singleton manging query
 * This manager has not to be exposed, it is used to handle queries
 * with the connector. It stack it during connector is not ready and
 * release it when connector ca query
 *
 * @author  Olivier Margarit
 * @since   0.1
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

    private pendingBatchDbQueries = <PendingDbQuery[]>[];

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

    private batchLock: any;

    private batchSubject: Subject<any> | undefined;

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
            this.queryConnector.getDbVersion().subscribe((version: string) => {
                console.log('old version: ' + version);
                const dataModel = ModelManager.getInstance().getDataModel();
                dataModel.version = ModelManager.version;
                console.log('new version: ' + dataModel.version);
                let isFailed: any = false;
                if (!version) {
                    console.log('call init data model migration');
                    modelMigration.initModel(dataModel).subscribe(() => {
                        console.log('init data model migration successed');
                    }, (err: any) => {
                        isFailed = err;
                        console.log('init data model migration failed');
                    }, () => {
                        if (isFailed) {
                            this.onInitializationFailure(isFailed);
                        } else {
                            this.dequeuePendingRequest();
                        }
                    });
                } else if (version !== ModelManager.version) {
                    console.log('call upgrade data model migration');
                    modelMigration.upgradeModel(dataModel, version).subscribe(() => {
                        console.log('upgrade data model migration successed');
                    }, (err: any) => {
                        isFailed = err;
                       console.log('upgrade data model migration failed');
                    }, () => {
                        if (isFailed) {
                            this.onInitializationFailure(isFailed);
                        } else {
                            this.dequeuePendingRequest();
                        }
                    });
                } else {
                    this.dequeuePendingRequest();
                }
            }, (err) => this.onInitializationFailure(err));
        } else {
            throw(new UnsatisfiedRequirementError(
                'ModelMigration or QueryConnector object is missing, check and fix NgDbHelperModule configuration !'));
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

    public startBatch(locker: any) {
        if (!this.batchLock) {
            this.batchLock = locker;
        }
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
        const subject = new Subject<QueryResult<any>>();
        if (this.batchLock) {
            this.pendingBatchDbQueries.push({
                dbQuery: dbQuery,
                observer: subject
            });
        } else if (this.isReady) {
            this.executeQuery(dbQuery, subject);
        } else {
            this.pendingDbQueries.push(new PendingDbQuery(dbQuery, subject));
        }
        return subject;
    }

    public execBatch(locker: any): Observable<QueryResult<any>> {
        const queries = <DbQuery[]>[];
        const observers = <Observer<QueryResult<any>>[]>[];
        if (!this.batchSubject) {
            this.batchSubject = new Subject<QueryResult<any>>();
        }
        if (this.batchLock === locker) {
            this.batchLock = null;
        } else {
            return this.batchSubject;
        }

        while (this.pendingBatchDbQueries.length) {
            const pendingQuery = this.pendingBatchDbQueries.shift()!;
            queries.push(pendingQuery.dbQuery);
            observers.push(pendingQuery.observer);
        }
        const obs = this.queryConnector!.queryBatch(queries);
        obs.map((res: any) => {
            for (const observer of observers) {
                observer.next({
                    insertId: undefined,
                    rowsAffected: 0,
                    rows: {
                        length: 0,
                        item: function (index: number): any {
                            return null;
                        },
                        toArray: function (): any[] {
                            return <any[]>[];
                        }
                    }
                });
                observer.complete();
            }
            return res;
        });
        obs.share().subscribe(this.batchSubject);
        this.batchSubject = undefined;
        return obs;
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
                this.queryConnector.query(dbQuery).subscribe(observer);
            } else {
                throw(new UnsatisfiedRequirementError('QueryConnector object is missing, check and fix NgDbHelperModule configuration !'))
            }
        }
    }
}
