import { Expr } from './generated/Expr'
import { RuntimeError } from './interpret'

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
		case 'binaryError':
			throw new RuntimeError(expr.operator, 'Binary expression error')
		case 'conditional':
			return parenthesize(
				'if',
				expr.condition,
				expr.consequent,
				expr.alternative
			)
		case 'variable':
			return expr.name.lexeme
		case 'assignment':
			return parenthesize(expr.name.lexeme, expr.value)
		case 'call':
			return parenthesize('call', expr.callee, ...expr.args)
		case 'get':
			return `(get, ${printExpr(expr.object)} ${expr.name})`
		case 'set':
			return `(set ${printExpr(expr.object)} ${expr.name} ${printExpr(expr.value)})`
		case 'lambda':
			return '<anonymous function>'
	}
}

function parenthesize(name: string, ...expressions: Expr[]): string {
	return `(${name}${expressions.map((e) => ` ${printExpr(e)}`).join()})`
}
