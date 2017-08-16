import { QueryPart } from './queries/query-part.model';

/**
 * @class DbQuery is a model to share query informations specifically to
 * the query connector.
 *
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class DbQuery {
    /**
     * @property page, the page number to retrieve for select queries
     */
    page = 0;

    /**
     * @property params, list of params of the query, see the sqlite
     * documenetations to learn about query parameters
     */
    params = <any[]>[];

    /**
     * @property query, the query string
     */
    query = '';

    /**
     * @property size, the number of result to retrieve per page
     * on select statement
     */
    size = 1000;

    /**
     * @property table, the table name of the main query target
     */
    table: string;

    /**
     * @property type, the type of query, ie SELECT, INSERT, UPDATE, DELETE
     */
    type: string;

    /**
     * @public
     * @method append is a part of private API.
     * this method is used to build query by appending part of it
     *
     * @param queryPart the {@link QueryPart}
     *
     * @return the db query instance to chain part appending
     */
    public append(queryPart: QueryPart): DbQuery {
        this.query = this.query.trim() + ' ' + queryPart.content.trim();
        this.params = this.params.concat(queryPart.params);
        return this;
    }
}
