/**
 * @public
 * @class BadColumnDeclarationError
 *
 * @description
 * thrown when a column declaration is detected
 *
 * @see Error
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class BadColumnDeclarationError implements Error {
    /**
     * @public
     * @property {string} name error name
     */
    public name: string;

    /**
     * @public
     * @property {any} stack error stack trace
     */
    public stack: any;
    /**
     * @public
     * @constructor
     * @param {string} message message explaining in details error
     */
    public constructor(public message: string) {
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
        this.message = message;
        this.name = 'bad column declaration error';
    }

    /**
     * @public
     * @method toString convert error to string
     *
     * @return {string} string represation of the error
     */
    public toString(): string {
        return name + '\n' + this.message;
    }
}
