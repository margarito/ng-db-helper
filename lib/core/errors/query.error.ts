export class QueryError extends Error {
    constructor(public message: string, private query: string, private params: string) {
        super();
        this.name = 'query error';
    }
}
