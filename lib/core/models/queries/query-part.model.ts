/**
 * @private API
 * @class QueryPart is private part of the API.
 * It is an intermidiate query object for builded query parts
 *
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class QueryPart {
    /**
     * @public
     * @property content, this string part of the query
     */
    public content = '';

    /**
     * @public
     * @property params, the parametrs of this part of query
     */
    public params = <any[]>[];

    /**
     * @public
     * @method append   append other query part to itself and return itself
     *                  to chain appending
     *
     * @param queryPart another query part
     *
     * @return the query part itself
     */
    public append(queryPart: QueryPart): QueryPart {
        this.content = this.content.trim() + ' ' + queryPart.content.trim();
        this.params = this.params.concat(queryPart.params);
        return this;
    }
}
