import { QueryPart } from '../queries/query-part.model';
import { DbTable } from '../structure/db-table.model';

/**
 * @private
 * @interface IClause
 *
 * @description
 * Clause interface
 *
 * @author Olivier Margarit
 *
 * @since 0.2
 */
export interface IClause {
    /**
     * @property {string} operator the operator that join the clause with the other
     */
    operator: string;

    /**
     * @method build build the query part to append with the main query
     *
     * @return {QueryPart} the part of the query to append to the main DbQuery.
     */
    build(): QueryPart;
}
