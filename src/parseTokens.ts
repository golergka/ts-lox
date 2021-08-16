import {
	assignmentExpr,
	binaryErrorExpr,
	binaryExpr,
	conditionalExpr,
	Expr,
	groupingExpr,
	literalExpr,
	unaryExpr,
	variableExpr
} from './generated/Expr'
import { expressionStmt, printStmt, Stmt, varStmt } from './generated/Stmt'
import { Token } from './Token'
import { TokenType } from './TokenType'

export interface ParserContext {
	parserError(line: number, message: string): void
	parserError(line: number, where: string, message: string): void
}

export function parseTokens(ctx: ParserContext, tokens: Token[]): Stmt[] {
	let current = 0

	function peek() {
		return tokens[current]
	}

	function previous() {
		return tokens[current - 1]
	}

	function isAtEnd() {
		return peek().type === 'EOF'
	}

	function advance() {
		if (!isAtEnd()) current++
		return previous()
	}

	/** Returns true if the current token is of given type. */
	function check(type: TokenType): boolean {
		return !isAtEnd() && peek().type === type
	}

	/** Matches any of the given token types. */
	function match(...tokenTypes: TokenType[]) {
		for (const type of tokenTypes) {
			if (check(type)) {
				advance()
				return true
			}
		}
		return false
	}

	class ParseError extends Error {}

	function error(token: Token, message: string) {
		if (token.type === 'EOF') {
			ctx.parserError(token.line, ' at end', message)
		} else {
			ctx.parserError(token.line, ` at '${token.lexeme}'`, message)
		}
		return new ParseError()
	}

	function consume(type: TokenType, message: string) {
		if (check(type)) return advance()

		throw error(peek(), message)
	}

	function primary(): Expr {
		if (match('FALSE')) return literalExpr(false)
		if (match('TRUE')) return literalExpr(true)
		if (match('NIL')) return literalExpr(null)
		if (match('NUMBER', 'STRING')) return literalExpr(previous().literal)
		if (match('IDENTIFIER')) return variableExpr(previous())
		if (match('LEFT_PAREN')) {
			const expr = expression()
			consume('RIGHT_PAREN', "Expect ')' after expression.")
			return groupingExpr(expr)
		}
		throw error(peek(), 'Expect expression.')
	}

	function unary(): Expr {
		if (match('BANG', 'MINUS')) {
			const operator = previous()
			const right = unary()
			return unaryExpr(operator, right)
		}
		return primary()
	}

	/**
	 * Creates a funciton to parse a left-associative series of binary operators
	 * given a list of token types, and an operand function
	 */
	function makeBinary(operand: () => Expr, ...tokenTypes: TokenType[]) {
		return () => {
			let expr = operand()

			while (match(...tokenTypes)) {
				const operator = previous()
				const right = operand()
				expr = binaryExpr(expr, operator, right)
			}

			return expr
		}
	}

	const factor = makeBinary(unary, 'SLASH', 'STAR')

	const term = makeBinary(factor, 'MINUS', 'PLUS')

	const comparison = makeBinary(
		term,
		'GREATER',
		'GREATER_EQUAL',
		'LESS',
		'LESS_EQUAL'
	)

	const equality = makeBinary(comparison, 'BANG_EQUAL', 'EQUAL_EQUAL')

	function conditional() {
		let expr = equality()

		while (match('QUESTION')) {
			const consequent = conditional()
			consume('COLON', "Expect ':' after conditional")
			const alternative = conditional()
			expr = conditionalExpr(expr, consequent, alternative)
		}

		return expr
	}

	function assignment(): Expr {
		const expr = conditional()
		
		if (match('EQUAL')) {
			const equals = previous()
			const value = assignment()

			if (expr.type === 'variable') {
				const name = expr.name
				return assignmentExpr(name, value)
			}

			error(equals, 'Invalid assignment target.')
		}
		
		return expr
	}

	function expression() {
		return assignment()
	}

	function binaryError() {
		if (
			match(
				'SLASH',
				'STAR',
				'PLUS',
				'GREATER',
				'GREATER_EQUAL',
				'LESS',
				'LESS_EQUAL',
				'BANG_EQUAL',
				'EQUAL_EQUAL'
			)
		) {
			const operator = previous()
			const right = expression()
			error(operator, 'Binary operator without left operand')
			return binaryErrorExpr(operator, right)
		}

		return expression()
	}

	const expressionSeries = makeBinary(binaryError, 'COMMA')

	function printStatement() {
		const value = expressionSeries()
		consume('SEMICOLON', "Expect ';' after value.")
		return printStmt(value)
	}

	function expressionStatement() {
		const expr = expressionSeries()
		consume('SEMICOLON', "Expect ';' after expression.")
		return expressionStmt(expr)
	}

	function statement(): Stmt {
		return match('PRINT') ? printStatement() : expressionStatement()
	}

	function synchronize() {
		advance()

		while (!isAtEnd()) {
			if (previous().type === 'SEMICOLON') return

			switch (peek().type) {
				case 'CLASS':
				case 'FUN':
				case 'VAR':
				case 'FOR':
				case 'IF':
				case 'WHILE':
				case 'PRINT':
				case 'RETURN':
					return
			}

			advance()
		}
	}

	function variableDeclaration() {
		const name = consume('IDENTIFIER', 'Expect variable name.')
		const initializer = match('EQUAL') ? expression() : null
		consume('SEMICOLON', "Expect ';' after variable declaration.")
		return varStmt(name, initializer)
	}

	function declaration() {
		try {
			return match('VAR') ? variableDeclaration() : statement()
		} catch (e) {
			if (e instanceof ParseError) {
				synchronize()
				return null
			}
			throw e
		}
	}

	try {
		const statements: Stmt[] = []
		while (!isAtEnd()) {
			const stmt = declaration()
			if (stmt) {
				statements.push(stmt)
			}
		}
		return statements
	} catch (e) {
		if (e instanceof ParseError) {
			return []
		} else {
			throw e
		}
	}
}
