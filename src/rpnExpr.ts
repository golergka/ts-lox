import { callExpr, Expr } from './generated/Expr'

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
		case 'assignment':
			return [
				rpnExpr(expr.value),
				expr.name,
				'='
			].join(' ')
		case 'get':
			return [
				rpnExpr(expr.object),
				expr.name,
				'get'
			].join(' ')
		case 'set':
			return [
				rpnExpr(expr.object),
				expr.name,
				rpnExpr(expr.value),
				'set'
			].join(' ')
		case 'call':
			return [
				...expr.args.map(rpnExpr),
				rpnExpr(expr.callee),
				'call'
			].join(' ')
		case 'lambda':
			return '<anonymous function>'
		case 'this':
			return 'this'
		case 'super':
			return [
				expr.method,
				'super'
			].join (' ')
	}
}
