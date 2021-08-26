import { ParserContext } from './parseTokens'
import { Token } from './token'

export class ParseError extends Error {}

export const parseError = (ctx: ParserContext) => (
	token: Token,
	message: string
) => {
	if (token.type === 'EOF') {
		ctx.parserError(token.line, ' at end', message)
	} else {
		ctx.parserError(token.line, ` at '${token.lexeme}'`, message)
	}
	return new ParseError()
}
