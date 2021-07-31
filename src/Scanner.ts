import { Token } from "./Token";

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
    
    public scanTokens() {
        while(!this.isAtEnd()) {
            this.start = this.current
            this.scanToken()
        }
        
        this.tokens.push(new Token('EOF', '', null, this.line))
        return this.tokens
    }
}