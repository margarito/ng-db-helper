import { IQueryHelper } from '../interfaces/i-query-helper.interface';
import { IJoin } from '../interfaces/i-join.interface';
import { DbTable } from '../structure/db-table.model';
import { ModelManager } from '../../managers/model-manager';
import { ClauseGroup } from './clause-group.model';
import { Clause } from './clause.model';
import { QueryPart } from './query-part.model';
import { QueryError } from '../../errors/query.error';
import { JoinType } from '../constants/join-type.constant';
import { QuerySelect } from './select.model';
import { DbHelperModel } from '../db-helper-model.model';

export class QueryJoin<T extends DbHelperModel> implements IJoin, IQueryHelper {
    private joinType = JoinType.DEFAULT;
    private onGroup: ClauseGroup | undefined;
    public alias: string;

    public constructor(private model: {new(): T} | QuerySelect<T>) {}

    public type(type: string): QueryJoin<T> {
        if (JoinType.isValid(type)) {
            if (type.toUpperCase() === 'DEFAULT') {
                this.joinType = JoinType.DEFAULT;
            } else {
                this.joinType = type;
            }
        } else {
            throw new QueryError('Join type "' + type + '" is invalid.', '', '');
        }
        return this;
    }

    public on(clauses: Clause|Clause[]|ClauseGroup|{[index: string]: any}): QueryJoin<T> {
        if (!this.onGroup) {
            this.onGroup = new ClauseGroup();
        }
        this.onGroup.add(clauses);
        return this;
    }

    public getProjectedTable(): DbTable {
        if (this.model instanceof QuerySelect) {
            return this.model.getProjectedTable();
        } else {
            return ModelManager.getInstance().getModel(this.model);
        }
    }

    public build(): QueryPart {
        const queryPart = new QueryPart();
        queryPart.content += this.joinType + ' JOIN';
        let table;
        if (this.model instanceof QuerySelect) {
            table = this.model.getProjectedTable();
            queryPart.appendSub(this.model.build());
        } else {
            table = ModelManager.getInstance().getModel(this.model);
            queryPart.appendContent(this.model.name);
        }
        queryPart.appendContent('AS');
        queryPart.appendContent(this.alias);
        queryPart.appendContent('ON');
        if (!this.onGroup) {
            throw new QueryError('you can\'t join "' + this.alias + '" without "on clauses".', '', '');
        }
        queryPart.append(this.onGroup.build());

        return queryPart;
    }
}

export function Join<T extends DbHelperModel>(model: {new(): T} | QuerySelect<T>): QueryJoin<T> {
    return new QueryJoin(model);
}
