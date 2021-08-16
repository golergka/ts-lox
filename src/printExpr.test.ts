import {
	binaryExpr,
	Expr,
	groupingExpr,
	literalExpr,
	unaryExpr,
	variableExpr
} from './generated/Expr'
import { printExpr } from './printExpr'
import { Token } from './Token'

describe(`printExpr`, () => {
	it(`handles textbook example`, () => {
		const expr: Expr = binaryExpr(
			unaryExpr(new Token('MINUS', '-', null, 1), literalExpr(123)),
			new Token('STAR', '*', null, 1),
			groupingExpr(literalExpr(45.67))
		)

		const result = printExpr(expr)

		expect(result).toMatchInlineSnapshot(`"(* (- 123), (group 45.67))"`)
	})
	
	it(`handles variables`, () => {
		const expr: Expr = binaryExpr(
			literalExpr(1),
			new Token('PLUS', '+', null, 1),
			variableExpr(new Token('STRING', 'x', null, 1))	
		)
		
		const result = printExpr(expr)

		expect(result).toMatchInlineSnapshot(`"(+ 1, x)"`)
	})
})
