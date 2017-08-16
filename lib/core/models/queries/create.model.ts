import { DbTable } from '../db-table.model';

/**
 * @private
 * @class QueryCreate is designed to be used behind {@link Create} function
 * this class is an helper to easily create a table from the datamodel
 *
 * @example
 * ```typescript
 * Create(TodoDataModel).exec().subscribe((QueryResult<any>) = {
 *      // todo something on create succeed
 * }, (err) => {
 *      // do something with the error
 * });
 * ```
 *
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class QueryCreate {
    /**
     * @public
     * @constructor should not be called directly for API design purpose
     *
     * @param table {@link DbTable} object with a single model infomations
     *              generated with table and column annotations
     */
    public constructor(private table: DbTable) {}

    /**
     * @public
     * @method build should be removed to be a part of the private API
     *
     * @return {@link DbQuery} of the query with the string part and
     *          clauses params.
     */
    public build(): string {
        const columns = [];
        for (const column of this.table.columnList) {
            let value = column.name + ' ' + (column.autoIncrement ? ' INTEGER' : column.type);
            value += (column.primaryKey ? ' PRIMARY KEY' : '');
            value += (column.autoIncrement ? ' AUTOINCREMENT' : '');
            columns.push(value);
        }
        const query = 'CREATE TABLE IF NOT EXISTS ' + this.table.name + ' (' + columns.join(',') + ')';
        return query;
    }
}

/**
 * @public API
 * @function Create is an helper to create table
 * This function is designed to help connectors to manage the datamodel
 *
 * @example
 * ```typescript
 * Create(TodoDataModel).exec().subscribe((QueryResult<any>) = {
 *      // todo something on create succeed
 * }, (err) => {
 *      // do something with the error
 * });
 * ```
 *
 * @author  Olivier Margarit
 * @Since   0.1
 */
export function Create(table: DbTable): QueryCreate {
    return new QueryCreate(table);
}
