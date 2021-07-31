import { report } from './lox'
import { Token } from './Token'
import { TokenType } from './TokenType'

export class Scanner {
	public constructor(private readonly source: string) {}

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
			case '(':
				return this.addToken('LEFT_PAREN')
			case ')':
				return this.addToken('RIGHT_PAREN')
			case '{':
				return this.addToken('LEFT_BRACE')
			case '}':
				return this.addToken('RIGHT_BRACE')
			case ',':
				return this.addToken('COMMA')
			case '.':
				return this.addToken('DOT')
			case '-':
				return this.addToken('MINUS')
			case '+':
				return this.addToken('PLUS')
			case ';':
				return this.addToken('SEMICOLON')
			case '*':
				return this.addToken('STAR')
			case '!':
				return this.addToken(this.match('=') ? 'BANG_EQUAL' : 'BANG')
			case '=':
				return this.addToken(this.match('=') ? 'EQUAL_EQUAL' : 'EQUAL')
			case '<':
				return this.addToken(this.match('=') ? 'LESS_EQUAL' : 'LESS')
			case '>':
				return this.addToken(this.match('=') ? 'GREATR_EQUAL' : 'GREATER')
			case '/':
				if (this.match('/')) {
					// A comment goes until the end of the line
					while (this.peek() != '\n' && !this.isAtEnd()) this.advance()
				} else {
					this.addToken('SLASH')
				}
				break
			case ' ':
			case '\r':
			case '\t':
				// Ignore whitespace
				break
			case '\n':
				this.line++
				break
			case '"':
				return this.string()
			default:
				return this.isDigit(c)
					? this.number()
					: report(this.line, 'Unexpected character.')
		}
	}

	isDigit(c: string) {
		return c >= '0' && c <= '9'
	}

	string() {
		while (this.peek() != '"' && this.isAtEnd()) {
			if (this.peek() == '\n') this.line++
			this.advance()
		}

		if (this.isAtEnd()) {
			report(this.line, 'Unterminated string.')
			return
		}

		// The closing "."
		this.advance()

		// Trim the surrounding quotes.
		const value = this.source.substring(this.start + 1, this.current - 1)
		this.addToken('STRING', value)
	}

	number() {
		while (this.isDigit(this.peek())) this.advance()

		if (this.peek() == '.' && this.isDigit(this.peekNext())) {
			this.advance()
			while (this.isDigit(this.peek())) this.advance()
		}

		this.addToken(
			'NUMBER',
			Number.parseFloat(this.source.substring(this.start, this.current))
		)
	}

	peek() {
		if (this.isAtEnd()) return '\0'
		return this.source.charAt(this.current)
	}

	peekNext() {
		if (this.current + 1 >= this.source.length) return '\0'
		return this.source.charAt(this.current + 1)
	}

	match(expected: string) {
		if (this.isAtEnd()) return false
		if (this.source.charAt(this.current) != expected) return false
		this.current++
		return true
	}

	advance(): string {
		return this.source.charAt(this.current++)
	}

	addToken(token: TokenType, literal?: any) {
		const text = this.source.substring(this.start, this.current)
		this.tokens.push(new Token(token, text, literal, this.line))
	}

	public scanTokens() {
		while (!this.isAtEnd()) {
			this.start = this.current
			this.scanToken()
		}

		this.tokens.push(new Token('EOF', '', null, this.line))
		return this.tokens
	}
}
