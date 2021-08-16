import { binaryErrorExpr, binaryExpr, conditionalExpr, literalExpr, unaryExpr } from './generated/Expr'
import { expressionStmt } from './generated/Stmt'
import { parseTokens } from './parseTokens'
import { scan } from './scan'
import { Token } from './Token'

describe(`parseTokens`, () => {
	it('1', () => {
		const tokens = scan(`1;`)
		const result = parseTokens(tokens)
		expect(result).toEqual([expressionStmt(literalExpr(1))])
	})

	it('"a";', () => {
		const tokens = scan('"a";')
		const result = parseTokens(tokens)
		expect(result).toEqual([expressionStmt(literalExpr('a'))])
	})

	it('2+2;', () => {
		const tokens = scan('2+2;')
		const result = parseTokens(tokens)
		expect(result).toEqual([expressionStmt(
			binaryExpr(
				literalExpr(2),
				new Token('PLUS', '+', undefined, 1),
				literalExpr(2)
			)
		)])
	})

	it('2+2; without EOF', () => {
		const tokens: Token[] = [
			new Token('NUMBER', '2', 2, 1),
			new Token('PLUS', '+', undefined, 1),
			new Token('NUMBER', '2', 2, 1),
			new Token('SEMICOLON', ';', undefined, 1)
		]

		expect(() => parseTokens(tokens)).toThrow()
	})

	it('1+2+3;', () => {
		const tokens = scan('1+2+3;')
		const result = parseTokens(tokens)
		expect(result).toEqual([expressionStmt(
			binaryExpr(
				binaryExpr(
					literalExpr(1),
					new Token('PLUS', '+', undefined, 1),
					literalExpr(2)
				),
				new Token('PLUS', '+', undefined, 1),
				literalExpr(3)
			)
		)])
	})
	
	it('*3;', () => {
		const tokens = scan('*3;')
		const result = parseTokens(tokens)
		expect(result).toEqual([expressionStmt(
			binaryErrorExpr(
				new Token('STAR', '*', undefined, 1),
				literalExpr(3)
			)
		)])
	})

	it('1+2*3;', () => {
		const tokens = scan('1+2*3;')
		const result = parseTokens(tokens)
		expect(result).toEqual([expressionStmt(
			binaryExpr(
				literalExpr(1),
				new Token('PLUS', '+', undefined, 1),
				binaryExpr(
					literalExpr(2),
					new Token('STAR', '*', undefined, 1),
					literalExpr(3)
				)
			)
		)])
	})

	it('!!true;', () => {
		const tokens = scan('!!true;')
		const result = parseTokens(tokens)
		expect(result).toEqual([expressionStmt(
			unaryExpr(
				new Token('BANG', '!', undefined, 1),
				unaryExpr(new Token('BANG', '!', undefined, 1), literalExpr(true))
			)
		)])
	})

	it('1,2;', () => {
		const tokens = scan('1,2;')
		const result = parseTokens(tokens)
		expect(result).toEqual([expressionStmt(
			binaryExpr(
				literalExpr(1),
				new Token('COMMA', ',', undefined, 1),
				literalExpr(2)
			)
		)])
	})

	it('1,2,3;', () => {
		const tokens = scan('1,2,3;')
		const result = parseTokens(tokens)
		expect(result).toEqual([expressionStmt(
			binaryExpr(
				binaryExpr(
					literalExpr(1),
					new Token('COMMA', ',', undefined, 1),
					literalExpr(2)
				),
				new Token('COMMA', ',', undefined, 1),
				literalExpr(3)
			)
		)])
	})
	
	it('true?1:2;', () => {
		const tokens = scan('true?1:2;')
		const result = parseTokens(tokens)
		expect(result).toEqual([expressionStmt(
			conditionalExpr(
				literalExpr(true),
				literalExpr(1),
				literalExpr(2),
			)
		)])
	})
})
