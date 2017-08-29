import { DbQuery } from '../db-query.model';
/**
 * @private
 * @class QueryPart
 *
 * @description
 * This class is private part of the API.
 * It is an intermidiate query object for builded query parts
 *
 * @author  Olivier Margarit
 *
 * @since   0.1
 */
export class QueryPart {
    /**
     * @public
     * @property {string} content string part of the query
     */
    public content = '';

    /**
     * @public
     * @property {Array<any>} params the parameters of this part of query
     */
    public params = <any[]>[];

    /**
     * @public
     * @method append   append other query part to itself and return itself
     *                  to chain appending
     *
     * @param {QueryPart} queryPart another query part to append
     *
     * @return {QueryPart} the query part itself
     */
    public append(queryPart: QueryPart): QueryPart {
        this.appendContent(queryPart.content);
        this.params = this.params.concat(queryPart.params);
        return this;
    }

    /**
     * @public
     * @method appendSub append sub query part
     *
     * @param {QueryPart} queryPart the query part to append
     *
     * @return {QueryPart} the query part instance to chain operation
     *
     * @since 0.2
     */
    public appendSub(queryPart: QueryPart | DbQuery): QueryPart {
        if (queryPart instanceof QueryPart) {
            this.content += ' (';
            this.append(queryPart);
            this.content += ')';
        } else {
            this.content += ' (';
            this.content += queryPart.query.trim();
            this.content += ')';
            this.params = this.params.concat(queryPart.params);
        }
        return this;
    }

    /**
     * @public
     * @method appendContent append query content to the query part
     *
     * @param {string} content the string part to append
     *
     * @return {QueryPart} the query part instance to chain operation
     *
     * @since 0.2
     */
    public appendContent(content: string): QueryPart {
        this.content = this.content + ' ' + content.trim();
        return this;
    }
}
