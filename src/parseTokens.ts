import {
	assignmentExpr,
	binaryErrorExpr,
	binaryExpr,
	conditionalExpr,
	Expr,
	groupingExpr,
	literalExpr,
	unaryExpr,
	variableExpr,
	callExpr
} from './generated/Expr'
import {
	blockStmt,
	breakErrorStmt,
	breakStmt,
	continueErrorStmt,
	continueStmt,
	expressionStmt,
	ifStmt,
	printStmt,
	Stmt,
	varStmt,
	whileStmt
} from './generated/Stmt'
import { Token } from './Token'
import { TokenType } from './TokenType'

export interface ParserContext {
	parserError(line: number, message: string): void
	parserError(line: number, where: string, message: string): void
}

export function parseTokens(
	ctx: ParserContext,
	tokens: Token[],
	expressions: boolean
): Stmt[] | Expr {
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

	function finishCall(expr: Expr): Expr {
		const args = []
		if (!check('RIGHT_PAREN')) {
			do {
				if (args.length >= 255) {
					error(peek(), "Can't have more than 255 arguments.")
				}
				args.push(expression())
			} while (match('COMMA'))
		}
		
		const paren = consume('RIGHT_PAREN', 'Expect ")" after arguments.')
		return callExpr(expr, paren, args)
	}

	function call(): Expr {
		let expr = primary()

		while (match('LEFT_PAREN')) {
			expr = finishCall(expr)
		}
		
		return expr
	}

	function unary(): Expr {
		if (match('BANG', 'MINUS')) {
			const operator = previous()
			const right = unary()
			return unaryExpr(operator, right)
		}
		return call()
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

	const and = makeBinary(equality, 'AND')

	const or = makeBinary(and, 'OR')

	function conditional() {
		let expr = or()

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

	function breakStatement(loopControls: boolean) {
		const brk = previous()
		consume('SEMICOLON', "Expect ';' after 'break'")
		if (loopControls) {
			return breakStmt(brk)
		} else {
			error(brk, 'Invalid break statement')
			return breakErrorStmt(brk)
		}
	}

	function continueStatement(loopControls: boolean) {
		const cont = previous()
		consume('SEMICOLON', "Expect ';' after 'continue'")
		if (loopControls) {
			return continueStmt(cont)
		} else {
			error(cont, 'Invalid continue statement')
			return continueErrorStmt(cont)
		}
	}

	function forStatement(): Stmt {
		consume('LEFT_PAREN', "Expect '(' after 'for'.")
		const initializer = match('SEMICOLON')
			? null
			: match('VAR')
			? variableDeclaration()
			: expressionStatement(false)
		const condition = check('SEMICOLON') ? literalExpr(true) : expression()
		consume('SEMICOLON', "Expect ';' after loop condition.")
		const increment = check('RIGHT_PAREN') ? null : expression()
		consume('RIGHT_PAREN', "Expect ')' after loop increment.")
		let body = statement(false, true)
		if (increment) {
			body = blockStmt([body, expressionStmt(increment)])
		}
		body = whileStmt(condition, body)
		if (initializer) {
			body = blockStmt([initializer, body])
		}
		return body
	}

	function ifStatement(loopControls: boolean) {
		consume('LEFT_PAREN', "Expect '(' after 'if'.")
		const condition = expression()
		consume('RIGHT_PAREN', "Expect ')' after condition.")
		const consequent = statement(false, loopControls)
		const alternative = match('ELSE') ? statement(false, loopControls) : null
		return ifStmt(condition, consequent, alternative)
	}

	function printStatement() {
		const value = expressionSeries()
		consume('SEMICOLON', "Expect ';' after value.")
		return printStmt(value)
	}

	function whileStatement() {
		consume('LEFT_PAREN', "Expect '(' after 'while'.")
		const condition = expression()
		consume('RIGHT_PAREN', "Expect ')' after condition.")
		const body = statement(false, true)
		return whileStmt(condition, body)
	}

	function blockStatement(loopControls: boolean): Stmt[] {
		const statements: Stmt[] = []

		while (!check('RIGHT_BRACE') && !isAtEnd()) {
			const stmt = declaration(false, loopControls)
			if (stmt !== null) {
				statements.push(stmt)
			}
		}

		consume('RIGHT_BRACE', "Expect '}' after block.")

		return statements
	}

	function expressionStatement(expressions: false): Stmt
	function expressionStatement(expressions: true): Stmt | Expr
	function expressionStatement(expressions: boolean): Stmt | Expr
	function expressionStatement(expressions: boolean): Stmt | Expr {
		const expr = expressionSeries()
		if (match('SEMICOLON')) {
			return expressionStmt(expr)
		} else if (expressions) {
			return expr
		} else {
			throw error(peek(), "Expect ';' after expression.")
		}
	}

	function statement(expressions: false, loopControls: boolean): Stmt
	function statement(expressions: true, loopControls: boolean): Stmt | Expr
	function statement(expressions: boolean, loopControls: boolean): Stmt | Expr
	function statement(expressions: boolean, loopControls: boolean): Stmt | Expr {
		if (match('BREAK')) return breakStatement(loopControls)
		if (match('CONTINUE')) return continueStatement(loopControls)
		if (match('FOR')) return forStatement()
		if (match('IF')) return ifStatement(loopControls)
		if (match('PRINT')) return printStatement()
		if (match('WHILE')) return whileStatement()
		if (match('LEFT_BRACE')) return blockStmt(blockStatement(loopControls))
		return expressionStatement(expressions)
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
		const initializer = match('EQUAL') ? expression() : undefined
		consume('SEMICOLON', "Expect ';' after variable declaration.")
		return varStmt(name, initializer)
	}

	function declaration(expressions: false, loopControls: boolean): Stmt | null
	function declaration(
		expressions: true,
		loopControls: boolean
	): Stmt | Expr | null
	function declaration(
		expressions: boolean,
		loopControls: boolean
	): Stmt | Expr | null {
		try {
			return match('VAR')
				? variableDeclaration()
				: statement(expressions, loopControls)
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
		if (expressions) {
			const first = declaration(true, false)
			switch (first?.type) {
				// All possible statements
				case 'block':
				case 'expression':
				case 'print':
				case 'var':
				case 'if':
				case 'while':
					statements.push(first)
					break
				// All possible expressions
				case 'conditional':
				case 'assignment':
				case 'binary':
				case 'binaryError':
				case 'grouping':
				case 'literal':
				case 'unary':
				case 'variable':
					return first
			}
		}
		while (!isAtEnd()) {
			const stmt = declaration(false, false)
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
