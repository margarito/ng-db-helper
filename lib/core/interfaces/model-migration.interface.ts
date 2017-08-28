import { DataModel } from '../models/structure/data-model.model';
import { Observable } from 'rxjs/Observable';

/**
 * @interface ModelMigration is a standardized interface to delegate migrations
 * ModelMigration instance has to be added to {@link NgDbHelperConfiguration}
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export interface ModelMigration {
    /**
     * @method initModel is a method called when model should be created
     *
     * @param dataModel {@link DataModel} generated with model annotations
     *
     * @return Observable resolved on initModel finish, not value is waited
     */
    initModel(dataModel: DataModel): Observable<any>;

    /**
     * @method upgradeModel is a method called when model should be upgrade
     *
     * @param dataModel {@link DataModel} generated with model annotations
     *
     * @return Observable resolved on initModel finish, not value is waited
     */
    upgradeModel(dataModel: DataModel, oldVersion: string): Observable<any>;
}
