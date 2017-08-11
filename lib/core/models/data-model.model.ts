import { DbTable } from './db-table.model';
export class DataModel {
    public tables = <DbTable[]>[];
    public version = '';

    constructor(tables: {[index:string]: any}) {
        for (const key in tables) {
            if (tables.hasOwnProperty(key)) {
                this.tables.push(tables[key]);
            }
        }
    }
}
