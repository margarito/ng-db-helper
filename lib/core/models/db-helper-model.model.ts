import { Insert } from './queries/insert.model';
import { Delete } from './queries/delete.model';
import { Update } from './queries/update.model';
import { Observable } from 'rxjs/Rx';

export abstract class DbHelperModel {
    public TABLE_NAME: string;

    public __rowid: number = null;
    public __class = DbHelperModel;
    public __inserted = false;
    public __partialWithProjection: string[] = null;

    public save(): Observable<any> {
        if (this.__inserted) {
            return Update(this).exec();
        } else {
            return Insert(this).exec();
        }
    }

    public delete(): Observable<any> {
        return Delete(this).exec();
    }
}
