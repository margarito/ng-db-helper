export class UnsatisfiedRequirementError extends Error {
    constructor(public message: string) {
        super();
        this.name = 'unsatisfied requirement error';
    }
}
