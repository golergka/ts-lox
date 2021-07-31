import { Token } from "./Token";
import { TokenType } from "./TokenType";

export class Scanner {
    public constructor(
        private readonly source: string
    ) { }

    private readonly tokens: Token[] = []
    private start: number = 0
    private current: number = 0
    private line: number = 1
    
    isAtEnd() {
        return this.current >= this.source.length
    }
    
    scanToken() {
        const c = this.advance()
        switch (c) {
            case '(': return this.addToken('LEFT_PAREN')
            case ')': return this.addToken('RIGHT_PAREN')
            case '{': return this.addToken('LEFT_BRACE')
            case '}': return this.addToken('RIGHT_BRACE')
            case ',': return this.addToken('COMMA')
            case '.': return this.addToken('DOT')
            case '-': return this.addToken('MINUS')
            case '+': return this.addToken('PLUS')
            case ';': return this.addToken('SEMICOLON')
            case '*': return this.addToken('STAR')
        }
    }

    advance(): string {
        return this.source.charAt(this.current++)
    }

    addToken(token: TokenType, literal?: object) {
        const text = this.source.substring(this.start, this.current)
        this.tokens.push(new Token(token, text, literal, this.line))
    }
    
    public scanTokens() {
        while(!this.isAtEnd()) {
            this.start = this.current
            this.scanToken()
        }
        
        this.tokens.push(new Token('EOF', '', null, this.line))
        return this.tokens
    }
}