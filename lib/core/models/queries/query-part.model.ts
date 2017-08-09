export class QueryPart {
    public content = '';
    public params = [];

    public append(queryPart: QueryPart): QueryPart {
        this.content = this.content.trim() + ' ' + queryPart.content.trim();
        this.params = this.params.concat(queryPart.params);
        return this;
    }
}
