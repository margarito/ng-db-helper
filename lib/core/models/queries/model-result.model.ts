import { DbHelperModel } from '../db-helper-model.model';
import { ModelManager } from '../../managers/model-manager';
import { QueryResult } from '../../interfaces/query-result.interface';

export class ModelResult<T extends DbHelperModel> implements QueryResult<T> {
    private cache: T[];
    get rowsAffected(): number {
        return this.result.rowsAffected;
    }

    get insertId(): number | undefined {
        return this.result.insertId;
    }

    get rows() {
        return {
            length: this.result.rows.length,
            item: (i: number): T => {
                if (!this.cache[i]) {
                    const entity = new this.model();
                    const item = this.result.rows.item(i);
                    const table = ModelManager.getInstance().getModel(this.model);
                    for (const column of table.columnList) {
                        if (this.projection && this.projection.indexOf(column.name) < 0) {
                            continue;
                        }
                        if (item.hasOwnProperty(column.name)) {
                            (entity as {[index:string]:any})[column.field] = item[column.name];
                        }
                    }
                    entity.__partialWithProjection = this.projection;
                    entity.__rowid = item.hasOwnProperty('rowid') ? item.rowid : null;
                    entity.__inserted = true;
                    this.cache[i] = entity;
                }
                return this.cache[i];
            }
        };
    };

    constructor(private result: QueryResult<any>, private model: {new(): T }, private projection?: string[]) {
        this.cache = new Array(result.rows.length).fill(null);
    }

}
