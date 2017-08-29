import { DbHelperModel } from './db-helper-model.model';
import { DbColumn } from './structure/db-column.model';

/**
 * @public
 * @class ShadowValue
 *
 * @description
 * This class is the data hidden model that link visible model to data store real value.
 * this informations are used in the shadow of the class model interface
 *
 * @author Olivier Margarit
 * @since 0.2
 */
export class ShadowValue {
    /**
     * @public
     * @property {DbColumn} column the column model representing the data store column
     */
    public column: DbColumn;

    /**
     * @public
     * @property {any} val the real value stored or to store in the database
     */
    public val: any;

    /**
     * @public
     * @property {any} prevVal the previous value set in the field
     */
    public prevVal: any;

    /**
     * @public
     * @property {DbHelperModel} foreign the model instance linked the value
     */
    public foreign: DbHelperModel;
}
