import { Insert } from './queries/insert.model';
import { Delete } from './queries/delete.model';
import { Update } from './queries/update.model';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

/**
 * @abstract
 * @class DbHelperModel is the base of models manage by the orm
 * it provides base method and fields to do the query magic
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export abstract class DbHelperModel {
    /**
     * @property TABLE_NAME, property is setted by the table annotation
     *           this property will be readonly in future release 
     */
    public TABLE_NAME: string;

    /**
     * @property __rowid is the standard sqlite rowid, this property is used
     *           to check if the model is already save and is setted on select
     *           queries.
     */
    public __rowid: number;

    /**
     * @property __class is the original class reference to enable query magic
     */
    public __class: {new(): DbHelperModel};

    /**
     * @property __inserted is a library helper to manage update or insert operation
     */
    public __inserted = false;

    /**
     * @property __partialWithProjection is a reference to prevent to nullify fields not
     *           not retrieve field on a select projection.
     */
    public __partialWithProjection: string[] | undefined;

    /**
     * @public
     * @method save the model method to save it in database
     * 
     * @return Observable to subscribe to save operation
     */
    public save(): Observable<any> {
        if (this.__inserted) {
            return Update(this).exec();
        } else {
            return Insert(this).exec();
        }
    }

    /**
     * @public
     * @method delete to delete th object from database
     * 
     * @return Observable to subscribe to save operation
     */
    public delete(): Observable<any> {
        return Delete(this).exec();
    }
}
