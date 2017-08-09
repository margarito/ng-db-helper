export interface QueryResult<T> {
    rowsAffected: number;
    insertId?: number;
    rows: {
        length: number;
        item(i: number): T;
    };
}
