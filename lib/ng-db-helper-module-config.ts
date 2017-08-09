import { QueryConnector } from './core/interfaces/query-connector.interface';
import { ModelMigration } from './core/interfaces/model-migration.interface';
export class NgDbHelperModuleConfig {
    public version = '';
    public queryConnector: QueryConnector;
    public modelMigration: ModelMigration;
}
