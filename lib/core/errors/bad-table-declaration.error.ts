/**
 * @class BadTableDeclarationError is thrown when a table declaration is detected
 * 
 * @see Error
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class BadTableDeclarationError extends Error {
    /**
     * @public
     * @constructor
     * @param message message explaining in details error 
     */
    public constructor(public message: string) {
        super();
        this.name = 'bad table declaration error';
    }
}
