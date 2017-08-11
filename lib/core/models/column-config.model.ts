export class ColumnConfig {
    public name?: string;
    public primaryKey?: boolean = false;
    public autoIncrement?: boolean = false;
    public unique?: boolean = false;
    public indexed?: boolean = false;
    public type?: string = 'string';
}
