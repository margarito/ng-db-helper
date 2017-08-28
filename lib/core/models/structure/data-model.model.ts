import { DbTable } from './db-table.model';

/**
 * @class DataModel, data model passed to the model migration
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class DataModel {
    /**
     * @public
     * @property tables, data model table list
     */
    public tables = <DbTable[]>[];

    /**
     * @public
     * @property version, data model varsion
     */
    public version = '';

    /**
     * @public
     * @constructor is a part of private API, DataModel is generated
     * by the NgDbHelperModule for the model migration
     *
     * @param tables tables of the data model
     */
    public constructor(tables: {[index: string]: any}) {
        for (const key in tables) {
            if (tables.hasOwnProperty(key)) {
                this.tables.push(tables[key]);
            }
        }
    }
}
