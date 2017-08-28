import { QueryPart } from '../queries/query-part.model';
import { DbTable } from '../structure/db-table.model';

export interface IJoin {
    alias: string;
    getProjectedTable(): DbTable;
    build(): QueryPart;
}
