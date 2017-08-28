import { QueryPart } from '../queries/query-part.model';
import { DbTable } from '../structure/db-table.model';

export interface IClause {
    operator: string;
    build(): QueryPart;
}
