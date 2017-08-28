/**
 * @class UnsatisfiedRequirementError is thrown when a requirement is unsatisfied
 *
 * @see Error
 * @author  Olivier Margarit
 * @since   0.1
 */
export class NotImplementedError implements Error {
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
        this.name = 'Not Implemented Error';
    }

    public toString(): string {
        return name + '\n' + this.message;
    }
}
