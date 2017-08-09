import { version } from 'punycode';
import { DbTable } from './db-table.model';
export class DataModel {
    public tables = <[DbTable]>[];
    public version = '';

    constructor(tables: Object) {
        for (const key in tables) {
            if (tables.hasOwnProperty(key)) {
                this.tables.push(tables[key]);
            }
        }
    }
}
