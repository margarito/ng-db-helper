export class BadTableDeclarationError extends Error {
    constructor(public message: string) {
        super();
        this.name = 'bad table declaration error';
    }
}
