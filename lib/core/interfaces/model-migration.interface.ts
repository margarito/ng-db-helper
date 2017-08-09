import { DataModel } from '../models/data-model.model';
import { Observable } from 'rxjs/Rx';

export interface ModelMigration {
    initModel(dataModel: DataModel): Observable<any>;

    upgradeModel(dataModel: DataModel, oldVersion: string): Observable<any>;
}
