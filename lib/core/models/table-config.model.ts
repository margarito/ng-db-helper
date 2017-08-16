/**
 * @class TableConfig a config model for {@link Table} annotation
 *
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class TableConfig {
    /**
     * @property name, optional configuration. If not provided, the default
     * value is th class name
     */
    public name?: string;

    /**
     * @property version, the table model version, information to help migration
     */
    public version? = 0;
}
