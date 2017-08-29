/**
 * @class TableConfig
 *
 * @description
 * a table configurator for model, @see {Table} annotation
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class TableConfig {
    /**
     * @property {string} name, optional configuration. If not provided, the default
     * value is th class name
     */
    public name?: string;

    /**
     * @property {number} version, the table model version, information to help migration
     */
    public version? = 0;
}
