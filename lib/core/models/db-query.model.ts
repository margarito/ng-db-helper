import { QueryPart } from './queries/query-part.model';

/**
 * @public
 * @class DbQuery
 *
 * @description
 * This class is a model to share query informations specifically to
 * the query connector.
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class DbQuery {
    /**
     * @public
     * @property {number} page the page number to retrieve for select queries
     */
    page = 0;

    /**
     * @public
     * @property {Array<any>} params list of params of the query, see the sqlite
     * documenetations to learn about query parameters
     */
    params = <any[]>[];

    /**
     * @public
     * @property {string} query the query string
     */
    query = '';

    /**
     * @public
     * @property {number} size the number of result to retrieve per page
     * on select statement
     */
    size = 1000;

    /**
     * @public
     * @property {string} table the table name of the main query target
     */
    table: string;

    /**
     * @public
     * @property {string} type the type of query, ie SELECT, INSERT, UPDATE, DELETE
     */
    type: string;

    /**
     * @public
     * @method append is a part of private API.
     * this method is used to build query by appending part of it
     *
     * @param {QueryPart} queryPart query part to append
     *
     * @return {DbQuery} the db query instance to chain part appending
     */
    public append(queryPart: QueryPart): DbQuery {
        this.query = this.query.trim() + ' ' + queryPart.content.trim();
        this.params = this.params.concat(queryPart.params);
        return this;
    }
}
