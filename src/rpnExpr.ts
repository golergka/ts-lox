import { Expr } from './generated/Expr'

export function rpnExpr(expr: Expr): string {
	switch (expr.type) {
		case 'binary':
			return [
				rpnExpr(expr.left),
				rpnExpr(expr.right),
				expr.operator.lexeme
			].join(' ')
		case 'grouping':
			return rpnExpr(expr.expression)
		case 'literal':
			return expr.value === null ? 'nil' : expr.value.toString()
		case 'unary':
			return [rpnExpr(expr.right), expr.operator.lexeme].join(' ')
		case 'binaryError':
			throw new Error('Did not expect binary error')
		case 'conditional':
			return [
				rpnExpr(expr.condition),
				rpnExpr(expr.consequent),
				rpnExpr(expr.alternative),
				'?'
			].join(' ')
		case 'variable':
			return expr.name.lexeme
	}
}
