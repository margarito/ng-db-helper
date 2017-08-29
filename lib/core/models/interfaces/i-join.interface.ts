import { QueryPart } from '../queries/query-part.model';
import { DbTable } from '../structure/db-table.model';

/**
 * @private
 * @interface IJoin
 *
 * @description
 * Join interface
 *
 * @author Olivier Margarit
 *
 * @since 0.2
 */
export interface IJoin {
    /**
     * @property {string} alias The alias to share for column references
     */
    alias: string;

    /**
     * @method getProjectedTable generate a projected table to collect columns in the parent query
     */
    getProjectedTable(): DbTable;

    /**
     * @method build the join query part builder to append in the main query
     *
     * @return {QueryPart} the query part to append to the main query
     */
    build(): QueryPart;
}
