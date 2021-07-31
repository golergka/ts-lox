import { TokenType } from "./TokenType";

export class Token {
    public constructor(
        private readonly type: TokenType,
        private readonly lexeme: string,
        private readonly literal: any,
        private readonly line: number
    ) {
    }
    
    public toString() {
        return `${this.type} ${this.lexeme} ${this.literal}`
    }
}