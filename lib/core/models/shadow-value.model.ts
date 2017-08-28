import { DbHelperModel } from './db-helper-model.model';
import { DbColumn } from './structure/db-column.model';

export class ShadowValue {
    column: DbColumn;
    val: any;
    prevVal: any;
    foreign: DbHelperModel;
}
