import { thrw } from 'thrw'
import { Expr } from './generated/Expr'
import { Stmt } from './generated/Stmt'
import { Token } from './Token'

export class RuntimeError extends Error {
	constructor(public readonly token: Token, message: string) {
		super(message)
	}
}

export interface InterpreterContext {
	runtimeError(error: RuntimeError): void
}

function isTruthy(right: Object | null) {
	return !!right
}

function isEqual(left: any, right: any): boolean {
	return left === right
}

function checkNumberOperand(
	operator: Token,
	right: Object | null
): right is number {
	if (typeof right !== 'number') {
		throw new RuntimeError(operator, `${operator} requires a number operand`)
	}
	return true
}

export function evaluate(expr: Expr): Object | null {
	switch (expr.type) {
		case 'literal':
			return expr.value

		case 'grouping':
			return evaluate(expr.expression)

		case 'unary': {
			const right = evaluate(expr.right)

			if (checkNumberOperand(expr.operator, right)) {
				switch (expr.operator.type) {
					case 'MINUS':
						return -right!
					case 'BANG':
						return !isTruthy(right)
				}
			}

			throw new RuntimeError(expr.operator, 'Unary matching exhausted')
		}

		case 'binary': {
			const left = evaluate(expr.left)
			const right = evaluate(expr.right)

			switch (expr.operator.type) {
				case 'BANG_EQUAL':
					return !isEqual(left, right)
				case 'EQUAL_EQUAL':
					return isEqual(left, right)
				case 'PLUS': {
					return typeof left === 'number' && typeof right === 'number'
						? left + right
						: typeof left === 'string' && typeof right === 'string'
						? left + right
						: thrw(
								new RuntimeError(
									expr.operator,
									`Invalid types for addition: left is ${typeof left} right is ${typeof right}`
								)
						  )
				}
			}

			if (
				checkNumberOperand(expr.operator, left) &&
				checkNumberOperand(expr.operator, right)
			) {
				switch (expr.operator.type) {
					case 'SLASH':
						return left / right
					case 'STAR':
						return left / right
					case 'GREATER':
						return left > right
					case 'GREATER_EQUAL':
						return left >= right
					case 'LESS':
						return left < right
					case 'LESS_EQUAL':
						return left <= right
				}
			}

			throw new RuntimeError(expr.operator, 'Binary matching exhausted')
		}

		case 'conditional': {
			const condition = evaluate(expr.condition)
			return isTruthy(condition)
				? evaluate(expr.consequent)
				: evaluate(expr.alternative)
		}
        
        case 'binaryError': {
            throw new RuntimeError(expr.operator, `Compilation error`)
        }
		
	}
}

function stringify(object: Object | null) {
	if (object === null) {
		return 'nil'
	}
	if (typeof object === 'number') {
		let text = object.toString()
		if (text.endsWith('.0')) {
			text = text.substring(0, text.length - 2)
		}
		return text
	}
	return object.toString()
}

function execute(statement: Stmt) {
	switch (statement.type) {
		case 'expression':
			evaluate(statement.expression)
			return null
		case 'print':
			const value = evaluate(statement.expression)
			console.log(stringify(value))
			return value
	}
}

export function interpret(ctx: InterpreterContext, statements: Stmt[]) {
	try {
		for (const statement of statements) {
			execute(statement)
		}
	} catch (e) {
		if (e instanceof RuntimeError) {
			ctx.runtimeError(e)
		}
		throw e
	}
}
