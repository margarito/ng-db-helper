/**
 * @class BadColumnDeclarationError is thrown when a column declaration is detected
 *
 * @see Error
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class BadColumnDeclarationError implements Error {
    public name: string;
    public extra: any;
    public stack: any;
    /**
     * @public
     * @constructor
     * @param message message explaining in details error
     */
    public constructor(public message: string) {
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
        this.message = message;
        this.name = 'bad column declaration error';
    }
}
