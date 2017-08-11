import { NgDbHelperModuleConfig } from '../../ng-db-helper-module-config';
import { Query } from '@angular/core';
import { ModelMigration } from '../interfaces/model-migration.interface';
import { QueryError } from '../errors/query.error';
import { ModelManager } from './model-manager';
import { DbQuery } from '../models/db-query.model';
import { UnsatisfiedRequirementError } from '../errors/unsatisfied-requirement.error';
import { QueryConnector } from '../interfaces/query-connector.interface';
import { Observable, Observer } from 'rxjs/Rx';
import { QueryResult } from '../interfaces/query-result.interface';
import { PendingDbQuery } from '../models/pending-db-query.model';

export class QueryManager {
    private static instance = new QueryManager();

    private pendingDbQueries = <PendingDbQuery[]>[];
    private isReady = false;
    private isInitializationFailed = false;
    private queryConnector: QueryConnector | undefined;
    private modelMigration: ModelMigration | undefined;

    public static init(config: NgDbHelperModuleConfig): QueryManager {
        const instance = QueryManager.getInstance();
        instance.queryConnector = config.queryConnector;
        instance.modelMigration = config.modelMigration;
        const modelManager = ModelManager.getInstance();
        ModelManager.version = config.version;
        if (config.autoIncrementVersion && ModelManager.version) {
            ModelManager.version += '.' + ModelManager.getInstance().getModelCount();
        }
        const subscribe = instance.queryConnector.onReady().subscribe((ready: boolean) => {
            if (ready) {
                instance.onQueryConnectorReady();
            } else {
                instance.onInitializationFailure(null);
            }
        }, instance.onInitializationFailure);
        return instance;
    }

    public static getInstance(): QueryManager {
        return QueryManager.instance;
    }

    private constructor() {}

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

    private onInitializationFailure(err: any) {
        console.error(err);
        this.isInitializationFailed = true;
        this.dequeuePendingRequest();
    }

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
     * query
     * @param dbQuery
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
     * executeQuery
     * @param dbQuery
     * @param observer
     */
    private executeQuery(dbQuery: DbQuery, observer: Observer<QueryResult<any>>) {
        if (this.isInitializationFailed) {
            const error = new QueryError('query manager initialization did failed', dbQuery.query,
                dbQuery.params ? dbQuery.params.join(', ') : '');
            observer.error(error);
        } else {
            if (this.queryConnector) {
                const subscription = this.queryConnector.query(dbQuery).subscribe((result: QueryResult<any>) => {
                    observer.next(result);
                    observer.complete();
                }, (err) => observer.error(err));
            } else {
                throw(new UnsatisfiedRequirementError('QueryConnector object is missing, check and fix NgDbHelperModule configuration !'))
            }
        }
    }
}
