export class BadColumnDeclarationError extends Error {
    constructor(public message: string) {
        super();
        this.name = 'bad column declaration error';
    }
}
