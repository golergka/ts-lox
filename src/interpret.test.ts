import { binaryErrorExpr, binaryExpr, conditionalExpr, groupingExpr, literalExpr } from './generated/Expr'
import { evaluate } from './interpret'
import { parseTokens } from './parseTokens'
import { scan } from './scan'
import { Token } from './Token'

describe('evaluate', () => {
	describe(`literals`, () => {
		it(`true`, () => {
			const expr = literalExpr(true)
			const result = evaluate(expr)
			expect(result).toEqual(true)
		})
	})

	describe(`binary operations`, () => {
		it('1+1', () => {
			const expr = binaryExpr(
				literalExpr(1),
				new Token('PLUS', '+', null, 1),
				literalExpr(1)
			)
			const result = evaluate(expr)
			expect(result).toEqual(2)
		})

		it(`1+1+1`, () => {
			const expr = binaryExpr(
				literalExpr(1),
				new Token('PLUS', '+', null, 1),
				binaryExpr(
					literalExpr(1),
					new Token('PLUS', '+', null, 1),
					literalExpr(1)
				)
			)
			const result = evaluate(expr)
			expect(result).toEqual(3)
		})

		it(`1>2`, () => {
			const expr = binaryExpr(
				literalExpr(1),
				new Token('GREATER', '>', null, 1),
				literalExpr(2)
			)
			const result = evaluate(expr)
			expect(result).toEqual(false)
		})
	})

	describe(`conditional operator`, () => {
		it(`true?1:2`, () => {
			const expr = conditionalExpr(
				literalExpr(true),
				literalExpr(1),
				literalExpr(2)
			)
			const result = evaluate(expr)
			expect(result).toEqual(1)
		})

		it(`1<3?5:3`, () => {
			const expr = conditionalExpr(
				binaryExpr(
					literalExpr(1),
					new Token('LESS', '<', null, 1),
					literalExpr(3)
				),
				literalExpr(5),
				literalExpr(3)
			)
			const result = evaluate(expr)
			expect(result).toEqual(5)
		})
	})

	describe(`grouping`, () => {
		it(`(true)`, () => {
			const expr = groupingExpr(literalExpr(true))
			const result = evaluate(expr)
			expect(result).toEqual(true)
		})

		it(`(1<3)?5:4`, () => {
			const expr = conditionalExpr(
				groupingExpr(
					binaryExpr(
						literalExpr(1),
						new Token('LESS', '<', null, 1),
						literalExpr(3)
					)
				),
				literalExpr(5),
				literalExpr(4)
			)
			const result = evaluate(expr)
			expect(result).toEqual(5)
		})
	})
})
