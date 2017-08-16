import { DbColumn } from './db-column.model';

/**
 * @class DbTable extends {@link TableConfig} is a table model
 * to help model migration to do his soup
 *
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class DbTable {
    /**
     * @property name cannot be an option information and is the table
     * name in database
     */
    public name: string;

    /**
     * @property version, the table model version, information to help migration
     */
    public version? = 0;

    /**
     * @property columnList is an array of DbColumn listing each column
     * sql properties
     */
    public columnList: DbColumn[];
}
