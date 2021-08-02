import { binaryExpr, conditionalExpr, literalExpr, unaryExpr } from './generated/Expr'
import { parseTokens } from './parseTokens'
import { scanTokens } from './scanTokens'
import { Token } from './Token'

describe(`parseTokens`, () => {
	it('1', () => {
		const tokens = scanTokens(`1`)
		const result = parseTokens(tokens)
		expect(result).toEqual(literalExpr(1))	
	})

	it('"a"', () => {
		const tokens = scanTokens('"a"')
		const result = parseTokens(tokens)
		expect(result).toEqual(literalExpr('a'))
	})

	it('2+2', () => {
		const tokens = scanTokens('2+2')
		const result = parseTokens(tokens)
		expect(result).toEqual(
			binaryExpr(
				literalExpr(2),
				new Token('PLUS', '+', undefined, 1),
				literalExpr(2)
			)
		)
	})

	it('2+2 without EOF', () => {
		const tokens: Token[] = [
			new Token('NUMBER', '2', 2, 1),
			new Token('PLUS', '+', undefined, 1),
			new Token('NUMBER', '2', 2, 1)
		]

		expect(() => parseTokens(tokens)).toThrow()
	})

	it('1+2+3', () => {
		const tokens = scanTokens('1+2+3')
		const result = parseTokens(tokens)
		expect(result).toEqual(
			binaryExpr(
				binaryExpr(
					literalExpr(1),
					new Token('PLUS', '+', undefined, 1),
					literalExpr(2)
				),
				new Token('PLUS', '+', undefined, 1),
				literalExpr(3)
			)
		)
	})

	it('1+2*3', () => {
		const tokens = scanTokens('1+2*3')
		const result = parseTokens(tokens)
		expect(result).toEqual(
			binaryExpr(
				literalExpr(1),
				new Token('PLUS', '+', undefined, 1),
				binaryExpr(
					literalExpr(2),
					new Token('STAR', '*', undefined, 1),
					literalExpr(3)
				)
			)
		)
	})

	it('!!true', () => {
		const tokens = scanTokens('!!true')
		const result = parseTokens(tokens)
		expect(result).toEqual(
			unaryExpr(
				new Token('BANG', '!', undefined, 1),
				unaryExpr(new Token('BANG', '!', undefined, 1), literalExpr(true))
			)
		)
	})

	it('1,2', () => {
		const tokens = scanTokens('1,2')
		const result = parseTokens(tokens)
		expect(result).toEqual(
			binaryExpr(
				literalExpr(1),
				new Token('COMMA', ',', undefined, 1),
				literalExpr(2)
			)
		)
	})

	it('1,2,3', () => {
		const tokens = scanTokens('1,2,3')
		const result = parseTokens(tokens)
		expect(result).toEqual(
			binaryExpr(
				binaryExpr(
					literalExpr(1),
					new Token('COMMA', ',', undefined, 1),
					literalExpr(2)
				),
				new Token('COMMA', ',', undefined, 1),
				literalExpr(3)
			)
		)
	})
	
	it('true?1:2', () => {
		const tokens = scanTokens('true?1:2')
		const result = parseTokens(tokens)
		expect(result).toEqual(
			conditionalExpr(
				literalExpr(true),
				literalExpr(1),
				literalExpr(2),
			)
		)
	})
})
