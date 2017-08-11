import { DbTable } from '../db-table.model';

export class QueryCreate {
    constructor(private table: DbTable) {}

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

export function Create(table: DbTable): QueryCreate {
    return new QueryCreate(table);
}
