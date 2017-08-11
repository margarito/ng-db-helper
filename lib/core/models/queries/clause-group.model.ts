import { QueryPart } from './query-part.model';
import { Clause } from './clause.model';

export class ClauseGroup {
    private clauses = <Clause[]>[];

    constructor(clauses?: any) {
        if (clauses) {
            this.add(clauses);
        }
    }

    public add(clauses: ClauseGroup|Clause|Clause[]|{[index: string]: any}) {
        if (clauses instanceof ClauseGroup) {
            this.add(clauses.clauses);
        } else if (clauses instanceof Clause) {
            this.clauses.push(clauses);
        } else if (Array.isArray(clauses)) {
            this.clauses = this.clauses.concat(clauses);
        } else {
            for (const key in clauses) {
                if (clauses.hasOwnProperty(key)) {
                    const clause = new Clause();
                    clause.key = key;
                    clause.value = clauses[key];
                    this.clauses.push(clause);
                }
            }
        }
    }

    public build(): QueryPart {
        const queryPart = new QueryPart;
        for (const clause of this.clauses) {
            if (queryPart.content) {
                queryPart.content += (clause.operator === Clause.OPERATORS.AND) ? Clause.OPERATORS.AND : Clause.OPERATORS.OR;
            }
            queryPart.append(clause.build());
        }
        return queryPart;
    }
}
