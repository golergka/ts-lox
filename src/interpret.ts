import { thrw } from 'thrw'
import { Environment } from './environment'
import { Expr } from './generated/Expr'
import { Stmt } from './generated/Stmt'
import { Token } from './token'
import { isCallable } from './callable'
import { LoxFunction } from './loxFunction'

export class RuntimeError extends Error {
	constructor(public readonly token?: Token, message?: string) {
		super(message)
	}
}

export interface InterpreterContext {
	runtimeError(error: RuntimeError): void
	print(value: string): void
	get locals(): Map<Expr, number>
	get globals(): Environment
	environment: Environment
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

export function evaluate(ctx: InterpreterContext, expr: Expr): Object | null {
	switch (expr.type) {
		case 'literal':
			return expr.value

		case 'grouping':
			return evaluate(ctx, expr.expression)

		case 'unary': {
			const right = evaluate(ctx, expr.right)

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
			const left = evaluate(ctx, expr.left)

			// Logical operators short-circuit
			switch (expr.operator.type) {
				case 'OR':
					return isTruthy(left) ? left : evaluate(ctx, expr.right)
				case 'AND':
					return isTruthy(left) ? evaluate(ctx, expr.right) : left
			}

			const right = evaluate(ctx, expr.right)

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
					case 'MINUS':
						return left - right
					case 'SLASH':
						return left / right
					case 'STAR':
						return left * right
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

			throw new RuntimeError(expr.operator, `Binary matching exhausted, unknown operator: ${expr.operator.lexeme}`)
		}

		case 'conditional': {
			const condition = evaluate(ctx, expr.condition)
			return isTruthy(condition)
				? evaluate(ctx, expr.consequent)
				: evaluate(ctx, expr.alternative)
		}

		case 'binaryError': {
			throw new RuntimeError(expr.operator, `Compilation error`)
		}

		case 'variable': {
			const distance = ctx.locals.get(expr)
			if (distance !== undefined) {
				return ctx.environment.getAt(distance, expr.name)
			} else {
				return ctx.globals.get(expr.name)
			}
		}

		case 'assignment': {
			const value = evaluate(ctx, expr.value)
			const distance = ctx.locals.get(expr)
			if (distance !== undefined) {
				ctx.environment.assignAt(distance, expr.name, value)
			} else {
				ctx.globals.assign(expr.name, value)
			}
			return value
		}

		case 'call': {
			const callee = evaluate(ctx, expr.callee)
			const args = expr.args.map((arg) => evaluate(ctx, arg))
			if (!isCallable(callee)) {
				throw new RuntimeError(
					expr.paren,
					'Can only call functions and classes'
				)
			} else if (args.length !== callee.arity) {
				throw new RuntimeError(
					expr.paren,
					`Expected ${callee.arity} arguments, but ${args.length} were provided`
				)
			} else {
				const result = callee.call(ctx, args)
				return result
			}
		}
		
		case 'lambda': 
			return new LoxFunction(expr, ctx.environment)
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

export function executeBlock(ctx: InterpreterContext, stmts: Stmt[]): void {
	for (const stmt of stmts) {
		execute(ctx, stmt)
	}
}

class Break extends RuntimeError {}

class Continue extends RuntimeError {}

export class Return extends RuntimeError {
	public constructor(public readonly value: Object | null) {
		super()
	 }
}

function execute(ctx: InterpreterContext, stmt: Stmt): Object | null {
	switch (stmt.type) {
		case 'expression': {
			evaluate(ctx, stmt.expression)
			return null
		}
		case 'print': {
			const value = evaluate(ctx, stmt.expression)
			ctx.print(stringify(value))
			return value
		}
		case 'var': {
			const value = stmt.initializer
				? evaluate(ctx, stmt.initializer)
				: stmt.initializer
			ctx.environment.define(stmt.name, value)
			return null
		}
		case 'block': {
			const enclosing = ctx.environment
			ctx.environment = new Environment(enclosing)
			try {
				executeBlock(ctx, stmt.statements)
			} finally {
				ctx.environment = enclosing
			}
			return null
		}
		case 'if': {
			if (isTruthy(evaluate(ctx, stmt.condition))) {
				execute(ctx, stmt.consequent)
			} else if (stmt.alternative) {
				execute(ctx, stmt.alternative)
			}
			return null
		}
		case 'while': {
			while (isTruthy(evaluate(ctx, stmt.condition))) {
				try {
					execute(ctx, stmt.body)
				} catch (e) {
					if (e instanceof Continue) {
						continue
					} else if (e instanceof Break) {
						break
					} else {
						throw e
					}
				}
			}
			return null
		}
		case 'function': {
			const func = new LoxFunction(stmt.lambda, ctx.environment)
			ctx.environment.define(stmt.name, func)
			return null
		}
		case 'return': {
			const value = stmt.value !== null
				? evaluate(ctx, stmt.value)
				: null
			throw new Return(value)
		}
		case 'break': {
			throw new Break()
		}
		case 'continue': {
			throw new Continue()
		}
		case 'breakError':
		case 'continueError': {
			throw new RuntimeError(stmt.body, `Compilation error`)
		}
	}
}

export function interpret(ctx: InterpreterContext, statements: Stmt[]) {
	try {
		executeBlock(ctx, statements)
	} catch (e) {
		if (e instanceof RuntimeError) {
			ctx.runtimeError(e)
		}
		throw e
	}
}
