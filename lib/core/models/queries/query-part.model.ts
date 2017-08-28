import { DbQuery } from '../db-query.model';
/**
 * @private API
 * @class QueryPart is private part of the API.
 * It is an intermidiate query object for builded query parts
 *
 * @author  Olivier Margarit
 * @since   0.1
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
        this.appendContent(queryPart.content);
        this.params = this.params.concat(queryPart.params);
        return this;
    }

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

    public appendContent(content: string): QueryPart {
        this.content = this.content + ' ' + content.trim();
        return this;
    }
}
