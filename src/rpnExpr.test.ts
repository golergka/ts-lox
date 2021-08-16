import { binaryExpr, literalExpr, variableExpr } from './generated/Expr'
import { rpnExpr } from './rpnExpr'
import { Token } from './Token'

describe('rpnExpr', () => {
	it('prints the textbook example', () => {
		const expr = binaryExpr(
			binaryExpr(
				literalExpr('1'),
				new Token('PLUS', '+', null, 1),
				literalExpr('2')
			),
			new Token('STAR', '*', null, 1),
			binaryExpr(
				literalExpr('4'),
				new Token('MINUS', '-', null, 1),
				literalExpr('3')
			)
		)

		const result = rpnExpr(expr)

		expect(result).toMatchInlineSnapshot(`"1 2 + 4 3 - *"`)
	})
	
	it('handles variables', () => {
		const expr = binaryExpr(
			literalExpr(1),
			new Token('PLUS', '+', null, 1),
			variableExpr(new Token('STRING', 'x', null, 1))	
		)
		
		const result = rpnExpr(expr)

		expect(result).toMatchInlineSnapshot(`"1 x +"`)
	})
})
