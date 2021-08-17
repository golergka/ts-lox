import { TokenType } from "./tokenType";

export class Token {
    public constructor(
        public readonly type: TokenType,
        public readonly lexeme: string,
        public readonly literal: any,
        public readonly line: number
    ) {
    }
    
    public toString() {
        return `${this.type} ${this.lexeme} ${this.literal}`
    }
}