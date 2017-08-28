export class JoinType {
    public static INNER = 'INNER';
    public static RIGHT = 'RIGHT';
    public static LEFT = 'LEFT';
    public static FULL = 'FULL';
    public static CROSS = 'CROSS';
    public static DEFAULT = '';

    public static isValid(type: string): boolean {
        return JoinType.hasOwnProperty(type.toUpperCase()) || type === '';
    }
}
