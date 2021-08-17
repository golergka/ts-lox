import { ParserContext } from './parseTokens'
import { Token } from './token'
import { keywords, TokenType } from './tokenType'

const isDigit = (c: string) => c >= '0' && c <= '9'

const isAlpha = (c: string) =>
	(c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_'

const isAlphaNumeric = (c: string) => isAlpha(c) || isDigit(c)

export function scan(ctx: ParserContext, source: string): Token[] {
	const tokens: Token[] = []
	let start: number = 0
	let current: number = 0
	let line: number = 1

	function isAtEnd() {
		return current >= source.length
	}

	function scanToken() {
		const c = advance()
		switch (c) {
			case '(':
				return addToken('LEFT_PAREN')
			case ')':
				return addToken('RIGHT_PAREN')
			case '{':
				return addToken('LEFT_BRACE')
			case '}':
				return addToken('RIGHT_BRACE')
			case ',':
				return addToken('COMMA')
			case '.':
				return addToken('DOT')
			case '-':
				return addToken('MINUS')
			case '+':
				return addToken('PLUS')
			case ';':
				return addToken('SEMICOLON')
			case '*':
				return addToken('STAR')
			case '?':
				return addToken('QUESTION')
			case ':':
				return addToken('COLON')
			case '!':
				return addToken(match('=') ? 'BANG_EQUAL' : 'BANG')
			case '=':
				return addToken(match('=') ? 'EQUAL_EQUAL' : 'EQUAL')
			case '<':
				return addToken(match('=') ? 'LESS_EQUAL' : 'LESS')
			case '>':
				return addToken(match('=') ? 'GREATER_EQUAL' : 'GREATER')
			case '/':
				if (match('/')) {
					// A comment goes until the end of the line
					while (peek() != '\n' && !isAtEnd()) advance()
				} else if (match('*')) {
					while (peek() != '*' && peekNext() != '/') advance()
					advance()
					advance()
				} else {
					addToken('SLASH')
				}
				break
			case ' ':
			case '\r':
			case '\t':
				// Ignore whitespace
				break
			case '\n':
				line++
				break
			case '"':
				return string()
			default:
				return isDigit(c)
					? number()
					: isAlpha(c)
					? identifier()
					: ctx.parserError(line, 'Unexpected character.')
		}
	}

	function string() {
		while (peek() != '"' && !isAtEnd()) {
			if (peek() == '\n') line++
			advance()
		}

		if (isAtEnd()) {
			ctx.parserError(line, 'Unterminated string.')
			return
		}

		// The closing "."
		advance()

		// Trim the surrounding quotes.
		const value = source.substring(start + 1, current - 1)
		addToken('STRING', value)
	}

	function number() {
		while (isDigit(peek())) advance()

		if (peek() == '.' && isDigit(peekNext())) {
			advance()
			while (isDigit(peek())) advance()
		}

		addToken('NUMBER', Number.parseFloat(source.substring(start, current)))
	}

	function identifier() {
		while (isAlphaNumeric(peek())) advance()
		const text = source.substring(start, current)
		const type = keywords[text] || 'IDENTIFIER'
		switch (type) {
			case 'TRUE':
				return addToken(type, true)
			case 'FALSE':
				return addToken(type, false)
			default:
				return addToken(type, text)
		}
	}

	function peek() {
		if (isAtEnd()) return '\0'
		return source.charAt(current)
	}

	function peekNext() {
		if (current + 1 >= source.length) return '\0'
		return source.charAt(current + 1)
	}

	function match(expected: string) {
		if (isAtEnd()) return false
		if (source.charAt(current) != expected) return false
		current++
		return true
	}

	function advance(): string {
		return source.charAt(current++)
	}

	function addToken(token: TokenType, literal?: any) {
		const text = source.substring(start, current)
		tokens.push(new Token(token, text, literal, line))
	}
	while (!isAtEnd()) {
		start = current
		scanToken()
	}

	tokens.push(new Token('EOF', '', undefined, line))
	return tokens
}
