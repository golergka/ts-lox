import {
	binaryExpr,
	Expr,
	groupingExpr,
	literalExpr,
	unaryExpr
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
})
