/**
 * @class BadColumnDeclarationError is thrown when a column declaration is detected
 * 
 * @see Error
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class BadColumnDeclarationError extends Error {
    /**
     * @public
     * @constructor
     * @param message message explaining in details error 
     */
    public constructor(public message: string) {
        super();
        this.name = 'bad column declaration error';
    }
}
