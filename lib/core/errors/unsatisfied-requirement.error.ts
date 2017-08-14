/**
 * @class UnsatisfiedRequirementError is thrown when a requirement is unsatisfied
 * 
 * @see Error
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class UnsatisfiedRequirementError extends Error {
    /**
     * @public
     * @constructor
     * @param message message explaining in details error 
     */
    public constructor(public message: string) {
        super();
        this.name = 'unsatisfied requirement error';
    }
}
