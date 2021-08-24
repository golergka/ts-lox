import { spy } from 'ts-mockito'
import { Callable } from './callable'
import { createGlobal } from './createGlobal'
import { Environment } from './environment'
import {
	assignmentExpr,
	binaryExpr,
	callExpr,
	conditionalExpr,
	groupingExpr,
	literalExpr,
	variableExpr
} from './generated/Expr'
import {
	blockStmt,
	breakStmt,
	continueStmt,
	expressionStmt,
	functionStmt,
	ifStmt,
	printStmt,
	returnStmt,
	varStmt,
	whileStmt
} from './generated/Stmt'
import {
	evaluate,
	interpret,
	InterpreterContext,
	RuntimeError
} from './interpret'
import { LoxFunction } from './loxFunction'
import { Token } from './token'

let env: Environment
let ctx: InterpreterContext
let spyCtx: InterpreterContext

class MockContext implements InterpreterContext {
	public readonly globals: Environment

	public constructor(public environment: Environment) {
		this.globals = environment
	}

	print(value: string): void { }

	runtimeError(error: RuntimeError): void {}
}

beforeEach(() => {
	env = new Environment(createGlobal())
	ctx = new MockContext(env)
	spyCtx = spy(ctx)
})

describe('evaluate', () => {
	describe(`literals`, () => {
		it(`true`, () => {
			const expr = literalExpr(true)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(true)
		})
	})

	describe(`binary operations`, () => {
		it('1+1', () => {
			const expr = binaryExpr(
				literalExpr(1),
				new Token('PLUS', '+', null, 1),
				literalExpr(1)
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(2)
		})
		
		it('2-1', () => {
			const expr = binaryExpr(
				literalExpr(2),
				new Token('MINUS', '-', null, 1),
				literalExpr(1)
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(1)
		})
		
		it('2*2', () => {
			const expr = binaryExpr(
				literalExpr(2),
				new Token('STAR', '*', null, 1),
				literalExpr(2)
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(4)	
		})
		
		it('9/3', () => {
			const expr = binaryExpr(
				literalExpr(9),
				new Token('SLASH', '/', null, 1),
				literalExpr(3)
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(3)
		})

		it(`1+1+1`, () => {
			const expr = binaryExpr(
				literalExpr(1),
				new Token('PLUS', '+', null, 1),
				binaryExpr(
					literalExpr(1),
					new Token('PLUS', '+', null, 1),
					literalExpr(1)
				)
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(3)
		})

		it(`1>2`, () => {
			const expr = binaryExpr(
				literalExpr(1),
				new Token('GREATER', '>', null, 1),
				literalExpr(2)
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(false)
		})

		it('true&&false', () => {
			const expr = binaryExpr(
				literalExpr(true),
				new Token('AND', '&&', null, 1),
				literalExpr(false)
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(false)
		})

		it('true&&true', () => {
			const expr = binaryExpr(
				literalExpr(true),
				new Token('AND', '&&', null, 1),
				literalExpr(true)
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(true)
		})

		it('"abc"&&"cde"', () => {
			const expr = binaryExpr(
				literalExpr('abc'),
				new Token('AND', '&&', null, 1),
				literalExpr('cde')
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual('cde')
		})

		it('"abc"||"cde"', () => {
			const expr = binaryExpr(
				literalExpr('abc'),
				new Token('OR', '||', null, 1),
				literalExpr('cde')
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual('abc')
		})

		it('false||"cde"', () => {
			const expr = binaryExpr(
				literalExpr(false),
				new Token('OR', '||', null, 1),
				literalExpr('cde')
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual('cde')
		})
	})

	describe(`conditional operator`, () => {
		it(`true?1:2`, () => {
			const expr = conditionalExpr(
				literalExpr(true),
				literalExpr(1),
				literalExpr(2)
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(1)
		})

		it(`1<3?5:3`, () => {
			const expr = conditionalExpr(
				binaryExpr(
					literalExpr(1),
					new Token('LESS', '<', null, 1),
					literalExpr(3)
				),
				literalExpr(5),
				literalExpr(3)
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(5)
		})
	})

	describe(`grouping`, () => {
		it(`(true)`, () => {
			const expr = groupingExpr(literalExpr(true))
			const result = evaluate(ctx, expr)
			expect(result).toEqual(true)
		})

		it(`(1<3)?5:4`, () => {
			const expr = conditionalExpr(
				groupingExpr(
					binaryExpr(
						literalExpr(1),
						new Token('LESS', '<', null, 1),
						literalExpr(3)
					)
				),
				literalExpr(5),
				literalExpr(4)
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(5)
		})
	})

	describe(`variables`, () => {
		it('gets a declared variable', () => {
			env.define(new Token('IDENTIFIER', 'x', undefined, 1), 1)
			const expr = variableExpr(new Token('IDENTIFIER', 'x', null, 1))
			const result = evaluate(ctx, expr)
			expect(result).toEqual(1)
		})

		it('throws on an undefined variable access', () => {
			const expr = variableExpr(new Token('IDENTIFIER', 'x', null, 1))
			expect(() => evaluate(ctx, expr)).toThrow()
		})

		it('throws on an undefined variable assignment', () => {
			const expr = assignmentExpr(
				new Token('IDENTIFIER', 'x', null, 1),
				literalExpr(1)
			)
			expect(() => evaluate(ctx, expr)).toThrow()
		})

		it('assigns a declared variable', () => {
			env.define(new Token('IDENTIFIER', 'x', undefined, 1), 1)
			const expr = assignmentExpr(
				new Token('IDENTIFIER', 'x', null, 1),
				literalExpr(2)
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(2)
		})

		it('throws on undefined, but uninitialized variable access', () => {
			env.define(new Token('IDENTIFIER', 'x', undefined, 1), undefined)
			const expr = variableExpr(new Token('IDENTIFIER', 'x', null, 1))
			expect(() => evaluate(ctx, expr)).toThrow()
		})
	})

	describe('function calls', () => {
		it('calls a function', () => {
			const callable: Callable = {
				call: () => {
					return 2
				},
				arity: 0
			}
			const expr = callExpr(
				literalExpr(callable),
				new Token('LEFT_PAREN', '(', '(', 1),
				[]
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(2)
		})

		it('throws on a null function call', () => {
			const expr = callExpr(
				literalExpr(null),
				new Token('LEFT_PAREN', '(', '(', 1),
				[literalExpr(1)]
			)
			expect(() => evaluate(ctx, expr)).toThrow()
		})

		it('throws on wrong arity of a function call', () => {
			const callable: Callable = {
				call: () => {
					return 2
				},
				arity: 0
			}
			const expr = callExpr(
				literalExpr(callable),
				new Token('LEFT_PAREN', '(', '(', 1),
				[literalExpr(1)]
			)
			expect(() => evaluate(ctx, expr)).toThrow()
		})

		it('calculates fibonacci numbers', () => {
			env.define(
				new Token('IDENTIFIER', 'fib', undefined, 1),
				new LoxFunction(
					functionStmt(
						new Token('IDENTIFIER', 'fib', undefined, 1),
						[new Token('IDENTIFIER', 'n', undefined, 1)],
						[
							ifStmt(
								binaryExpr(
									variableExpr(new Token('IDENTIFIER', 'n', undefined, 1)),
									new Token('LESS_EQUAL', '<', null, 1),
									literalExpr(1)
								),
								returnStmt(
									new Token('RETURN', 'return', undefined, 1),
									variableExpr(new Token('IDENTIFIER', 'n', undefined, 1))
								),
								null
							),
							returnStmt(
								new Token('RETURN', 'return', undefined, 1),
								binaryExpr(
									callExpr(
										variableExpr(new Token('IDENTIFIER', 'fib', undefined, 1)),
										new Token('LEFT_PAREN', '(', '(', 1),
										[
											binaryExpr(
												variableExpr(new Token('IDENTIFIER', 'n', undefined, 1)),
												new Token('MINUS', '-', null, 1),
												literalExpr(2)
											)
										]
									),
									new Token('PLUS', '+', null, 1),
									callExpr(
										variableExpr(new Token('IDENTIFIER', 'fib', undefined, 1)),
										new Token('LEFT_PAREN', '(', '(', 1),
										[
											binaryExpr(
												variableExpr(new Token('IDENTIFIER', 'n', undefined, 1)),
												new Token('MINUS', '-', null, 1),
												literalExpr(1)
											)
										]
									)
								)
							)
						]
					),
					env
				)
			)
			const expr = callExpr(
				variableExpr(new Token('IDENTIFIER', 'fib', undefined, 1)),
				new Token('LEFT_PAREN', '(', '(', 1),
				[literalExpr(6)]
			)
			const result = evaluate(ctx, expr)
			expect(result).toEqual(8)
		})
	})
})

describe('intepret', () => {
	describe('variables', () => {
		it('defines variable with assignment', () => {
			const stmts = [
				varStmt(new Token('IDENTIFIER', 'x', undefined, 1), literalExpr(1))
			]
			interpret(ctx, stmts)
			expect(env.get(new Token('IDENTIFIER', 'x', undefined, 1))).toEqual(1)
		})

		it('defines variable and assigns later', () => {
			const stmts = [
				varStmt(new Token('IDENTIFIER', 'x', undefined, 1), undefined),
				expressionStmt(
					assignmentExpr(
						new Token('IDENTIFIER', 'x', undefined, 1),
						literalExpr(1)
					)
				)
			]
			interpret(ctx, stmts)
			expect(env.get(new Token('IDENTIFIER', 'x', undefined, 1))).toEqual(1)
		})
	})

	describe('control flow', () => {
		it('runs an if block', () => {
			env.define(new Token('IDENTIFIER', 'x', undefined, 1), undefined)
			const stmts = [
				ifStmt(
					literalExpr(true),
					expressionStmt(
						assignmentExpr(
							new Token('IDENTIFIER', 'x', undefined, 1),
							literalExpr(1)
						)
					),
					expressionStmt(
						assignmentExpr(
							new Token('IDENTIFIER', 'x', undefined, 1),
							literalExpr(2)
						)
					)
				)
			]
			interpret(ctx, stmts)
			expect(env.get(new Token('IDENTIFIER', 'x', undefined, 1))).toEqual(1)
		})

		it('runs a while block', () => {
			env.define(new Token('IDENTIFIER', 'x', undefined, 1), true)
			const stmts = [
				whileStmt(
					variableExpr(new Token('IDENTIFIER', 'x', undefined, 1)),
					expressionStmt(
						assignmentExpr(
							new Token('IDENTIFIER', 'x', undefined, 1),
							literalExpr(false)
						)
					)
				)
			]
			interpret(ctx, stmts)
			expect(env.get(new Token('IDENTIFIER', 'x', undefined, 1))).toEqual(false)
		})

		it('breaks a while block', () => {
			const stmts = [
				whileStmt(
					literalExpr(true),
					breakStmt(new Token('BREAK', 'break', 'break', 1))
				)
			]
			interpret(ctx, stmts)
		})

		it('continues a while block', () => {
			env.define(new Token('IDENTIFIER', 'x', undefined, 1), 0)
			env.define(new Token('IDENTIFIER', 'y', undefined, 1), false)
			const stmts = [
				whileStmt(
					binaryExpr(
						variableExpr(new Token('IDENTIFIER', 'x', undefined, 1)),
						new Token('LESS', '<', '<', 1),
						literalExpr(10)
					),
					blockStmt([
						expressionStmt(
							assignmentExpr(
								new Token('IDENTIFIER', 'x', undefined, 1),
								binaryExpr(
									variableExpr(new Token('IDENTIFIER', 'x', undefined, 1)),
									new Token('PLUS', '+', '+', 1),
									literalExpr(1)
								)
							)
						),
						continueStmt(new Token('CONTINUE', 'continue', 'continue', 1)),
						expressionStmt(
							assignmentExpr(
								new Token('IDENTIFIER', 'y', undefined, 1),
								literalExpr(true)
							)
						)
					])
				)
			]
			interpret(ctx, stmts)
			expect(env.get(new Token('IDENTIFIER', 'x', undefined, 1))).toEqual(10)
			expect(env.get(new Token('IDENTIFIER', 'y', undefined, 1))).toEqual(false)
		})
	})

	describe('function declaration', () => {
		it('defines a function', () => {
			const stmts = [
				functionStmt(
					new Token('IDENTIFIER', 'foo', undefined, 1),
					[],
					[printStmt(literalExpr('hello world'))]
				)
			]
			interpret(ctx, stmts)
			const fn = env.get(new Token('IDENTIFIER', 'foo', undefined, 1))
			expect(fn).toBeInstanceOf(LoxFunction)
			expect((fn as LoxFunction).arity).toBe(0)
		})
	})
})
