import { thrw } from 'thrw'
import { Environment } from './environment'
import { Expr } from './generated/Expr'
import { Stmt, varStmt } from './generated/Stmt'
import { Token } from './Token'

export class RuntimeError extends Error {
	constructor(public readonly token: Token, message: string) {
		super(message)
	}
}

export interface InterpreterContext {
	runtimeError(error: RuntimeError): void
	get environment(): Environment
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

export function evaluate(env: Environment, expr: Expr): Object | null {
	switch (expr.type) {
		case 'literal':
			return expr.value

		case 'grouping':
			return evaluate(env, expr.expression)

		case 'unary': {
			const right = evaluate(env, expr.right)

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
			const left = evaluate(env, expr.left)

			// Logical operators short-circuit
			switch (expr.operator.type) {
				case 'OR':
					return isTruthy(left) ? left : evaluate(env, expr.right)
				case 'AND':
					return isTruthy(left) ? evaluate(env, expr.right) : left
			}

			const right = evaluate(env, expr.right)

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
			const condition = evaluate(env, expr.condition)
			return isTruthy(condition)
				? evaluate(env, expr.consequent)
				: evaluate(env, expr.alternative)
		}
        
        case 'binaryError': {
            throw new RuntimeError(expr.operator, `Compilation error`)
        }
		
		case 'variable': {
			return env.get(expr.name)
		}
		
		case 'assignment': {
			const value = evaluate(env, expr.value)
			env.assign(expr.name, value)
			return value
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

function executeBlock(env: Environment, stmts: Stmt[]): void {
	for (const stmt of stmts) {
		execute(env, stmt)
	}
}

function execute(env: Environment, stmt: Stmt): Object|null {
	switch (stmt.type) {
		case 'expression': {
			evaluate(env, stmt.expression)
			return null
		}
		case 'print': {
			const value = evaluate(env, stmt.expression)
			console.log(stringify(value))
			return value
		}
		case 'var': {
			const value = stmt.initializer
				? evaluate(env, stmt.initializer)
				: stmt.initializer
			env.define(stmt.name, value)
			return null
		}
		case 'block': {
			executeBlock(new Environment(env), stmt.statements)
			return null
		}
		case 'if': {
			if (isTruthy(evaluate(env, stmt.condition))) {
				execute(env, stmt.consequent)
			} else if (stmt.alternative) {
				execute(env, stmt.alternative)
			}
			return null
		}
		case 'while': {
			while (isTruthy(evaluate(env, stmt.condition))) {
				execute(env, stmt.body)
			}
			return null
		}
	}
}

export function interpret(ctx: InterpreterContext, statements: Stmt[]) {
	try {
		executeBlock(ctx.environment, statements)
	} catch (e) {
		if (e instanceof RuntimeError) {
			ctx.runtimeError(e)
		}
		throw e
	}
}
