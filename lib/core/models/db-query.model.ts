import { QueryPart } from './queries/query-part.model';
export class DbQuery {
    page = 0;
    params = <any[]>[];
    query = '';
    size = 1000;
    table: string;
    type: string;

    public append(queryPart: QueryPart): DbQuery {
        this.query = this.query.trim() + ' ' + queryPart.content.trim();
        this.params = this.params.concat(queryPart.params);
        return this;
    }
}
