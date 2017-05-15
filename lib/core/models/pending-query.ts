import { Deferer} from './deferer';

export class PendingQuery {
    public query: string;
    public params: any[];
    public deferred: Deferer<any>;
}