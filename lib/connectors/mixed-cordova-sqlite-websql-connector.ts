import { CordovaSqliteConnector } from './cordova-sqlite-connector';
import { WebsqlConnector } from './websql-connector';
import { WebsqlConnectorConfiguration } from './configurations/websql-connector-configuration';
import { CordovaSqliteConnectorConfiguration } from './configurations/cordova-sqlite-connector-configuration';
import { Observable, Observer } from 'rxjs/Rx';
import { QueryResult } from '../core/interfaces/query-result.interface';
import { DbQuery } from '../core/models/db-query.model';
import { ModelMigration } from '../core/interfaces/model-migration.interface';
import { QueryConnector } from '../core/interfaces/query-connector.interface';
import { DataModel } from '../core/models/data-model.model';
import { UnsatisfiedRequirementError } from '../core/errors/unsatisfied-requirement.error';

export class MixedCordovaSqliteWebsqlConnector implements QueryConnector, ModelMigration {
    private ready = false;
    private onReadyObserver: Observer<boolean>;
    private connector: QueryConnector & ModelMigration;

    constructor(private config: CordovaSqliteConnectorConfiguration) {
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

    private setupWebsqlConnector() {
        const connectorConfig = new WebsqlConnectorConfiguration();
        connectorConfig.dbName = this.config.dbName;
        connectorConfig.dbVersion = this.config.dbVersion;
        this.connector = new WebsqlConnector(connectorConfig);
        this.observeConnectorReady();
    }

    private setupCordovaConnector() {
        this.connector = new CordovaSqliteConnector(this.config);
        this.observeConnectorReady();
    }

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
     * query
     */
    query(dbQuery: DbQuery): Observable<QueryResult<any>> {
        return this.connector.query(dbQuery);
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
        return this.connector.getDbVersion();
    }

    initModel(dataModel: DataModel): Observable<any> {
        return this.connector.initModel(dataModel);
    }

    upgradeModel(dataModel: DataModel, oldVersion: string): Observable<any> {
        return this.connector.upgradeModel(dataModel, oldVersion);
    }
}
