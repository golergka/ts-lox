import { Expr } from './generated/Expr'

export function printExpr(expr: Expr): string {
	switch (expr.type) {
		case 'binary':
			return parenthesize(expr.operator.lexeme, expr.left, expr.right)
		case 'grouping':
			return parenthesize('group', expr.expression)
		case 'literal':
			return expr.value === null ? 'nil' : expr.value.toString()
		case 'unary':
			return parenthesize(expr.operator.lexeme, expr.right)
	}
}

function parenthesize(name: string, ...expressions: Expr[]): string {
	return `(${name}${expressions.map((e) => ` ${printExpr(e)}`).join()})`
}
