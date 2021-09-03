import { anything, spy, verify } from 'ts-mockito'
import { Callable } from './callable'
import { createGlobal } from './createGlobal'
import { Environment } from './environment'
import {
	assignmentExpr,
	binaryExpr,
	callExpr,
	conditionalExpr,
	Expr,
	getExpr,
	groupingExpr,
	lambdaExpr,
	literalExpr,
	superExpr,
	variableExpr
} from './generated/Expr'
import {
	blockStmt,
	breakStmt,
	classStmt,
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
let locals: Map<Expr, number>
let ctx: InterpreterContext
let spyCtx: InterpreterContext

class MockContext implements InterpreterContext {
	public readonly globals: Environment

	public constructor(
		public readonly locals: Map<Expr, number>,
		public environment: Environment
	) {
		this.globals = environment
	}

	print(value: string): void {}

	runtimeError(error: RuntimeError): void {}
}

beforeEach(() => {
	env = new Environment(createGlobal())
	locals = new Map()
	ctx = new MockContext(locals, env)
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
			/**
			 * function fib(n) {
			 * 	 if (n <= 1) {
			 *     return 1
			 *   }
			 *   return fib(n - 1) + fib(n - 2)
			 * }
			 */

			// In real code, these would be different expressions for all the
			// occurrences of the variable, but for the sake of simplicity,
			// we'll just use the same one for all of them.
			const nVarExpr = variableExpr(new Token('IDENTIFIER', 'n', undefined, 1))
			const fibInnerVarExpr = variableExpr(
				new Token('IDENTIFIER', 'fib', undefined, 1)
			)
			env.define(
				new Token('IDENTIFIER', 'fib', undefined, 1),
				new LoxFunction(
					lambdaExpr(
						[new Token('IDENTIFIER', 'n', undefined, 1)],
						[
							ifStmt(
								binaryExpr(
									nVarExpr,
									new Token('LESS_EQUAL', '<=', null, 1),
									literalExpr(1)
								),
								returnStmt(
									new Token('RETURN', 'return', undefined, 1),
									nVarExpr
								),
								null
							),
							returnStmt(
								new Token('RETURN', 'return', undefined, 1),
								binaryExpr(
									callExpr(
										fibInnerVarExpr,
										new Token('LEFT_PAREN', '(', '(', 1),
										[
											binaryExpr(
												nVarExpr,
												new Token('MINUS', '-', null, 1),
												literalExpr(2)
											)
										]
									),
									new Token('PLUS', '+', null, 1),
									callExpr(
										fibInnerVarExpr,
										new Token('LEFT_PAREN', '(', '(', 1),
										[
											binaryExpr(
												nVarExpr,
												new Token('MINUS', '-', null, 1),
												literalExpr(1)
											)
										]
									)
								)
							)
						]
					),
					env,
					false
				)
			)
			locals.set(fibInnerVarExpr, 1)
			locals.set(nVarExpr, 0)
			const fibOuterVarExpr = variableExpr(
				new Token('IDENTIFIER', 'fib', undefined, 1)
			)
			locals.set(fibOuterVarExpr, 0)
			const expr = callExpr(
				fibOuterVarExpr,
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
					lambdaExpr([], [printStmt(literalExpr('hello world'))])
				)
			]
			interpret(ctx, stmts)
			const fn = env.get(new Token('IDENTIFIER', 'foo', undefined, 1))
			expect(fn).toBeInstanceOf(LoxFunction)
			expect((fn as LoxFunction).arity).toBe(0)
		})
	})

	describe('classes', () => {
		it('prints a declared class', () => {
			// class DevonshireCream {
			//   serveOn() {
			//     return "Scones";
			//   }
			// }
			// print DevonshireCream; // "Scones"
			const stmts = [
				classStmt(
					new Token('IDENTIFIER', 'DevonshireCream', null, 1),
					null,
					[
						functionStmt(
							new Token('IDENTIFIER', 'serveOn', null, 1),
							lambdaExpr(
								[],
								[
									returnStmt(
										new Token('RETURN', 'return', null, 1),
										literalExpr('Scones')
									)
								]
							)
						)
					],
					[]
				),
				printStmt(
					variableExpr(new Token('IDENTIFIER', 'DevonshireCream', null, 1))
				)
			]
			interpret(ctx, stmts)
			verify(spyCtx.print('DevonshireCream')).once()
		})

		it('creates a class instance', () => {
			// class Bagel {
			// }
			// Bagel(); // creates Bagel instance
			const stmts = [
				classStmt(new Token('IDENTIFIER', 'Bagel', null, 1), null, [], []),
				expressionStmt(
					callExpr(
						variableExpr(new Token('IDENTIFIER', 'Bagel', null, 1)),
						new Token('LEFT_PAREN', '(', '(', 1),
						[]
					)
				)
			]
			interpret(ctx, stmts)
			verify(spyCtx.runtimeError(anything())).never()
		})

		it('prints a class instance', () => {
			// class Bagel {
			// }
			// var bagel = Bagel();
			// print bagel; // prints Bagel instance
			const stmts = [
				classStmt(new Token('IDENTIFIER', 'Bagel', null, 1), null, [], []),
				varStmt(
					new Token('IDENTIFIER', 'bagel', null, 1),
					callExpr(
						variableExpr(new Token('IDENTIFIER', 'Bagel', null, 1)),
						new Token('LEFT_PAREN', '(', '(', 1),
						[]
					)
				),
				printStmt(variableExpr(new Token('IDENTIFIER', 'bagel', null, 1)))
			]
			interpret(ctx, stmts)
			verify(spyCtx.runtimeError(anything())).never()
			verify(spyCtx.print('instance of Bagel')).once()
		})

		it('calls a class instance method', () => {
			// class Bacon {
			//   eat() {
			//     print "Crunch crunch crunch!";
			//   }
			// }
			// Bacon().eat(); // prints "Crunch crunch crunch!"
			const stmts = [
				classStmt(
					new Token('IDENTIFIER', 'Bacon', null, 1),
					null,
					[
						functionStmt(
							new Token('IDENTIFIER', 'eat', null, 1),
							lambdaExpr([], [printStmt(literalExpr('Crunch crunch crunch!'))])
						)
					],
					[]
				),
				expressionStmt(
					callExpr(
						getExpr(
							callExpr(
								variableExpr(new Token('IDENTIFIER', 'Bacon', null, 1)),
								new Token('LEFT_PAREN', '(', '(', 1),
								[]
							),
							new Token('IDENTIFIER', 'eat', null, 1)
						),
						new Token('LEFT_PAREN', '(', '(', 1),
						[]
					)
				)
			]
			interpret(ctx, stmts)
			verify(spyCtx.runtimeError(anything())).never()
			verify(spyCtx.print('Crunch crunch crunch!')).once()
		})

		it('calls a class instance method with reference to this', () => {
			// class Egotist {
			//   speak() {
			//     print this;
			//   }
			// }
			// var method = Egotist().speak;
			// method(); // prints "instance of Egotist"
			const thisExpr = variableExpr(new Token('IDENTIFIER', 'this', null, 1))
			const stmts = [
				classStmt(
					new Token('IDENTIFIER', 'Egotist', null, 1),
					null,
					[
						functionStmt(
							new Token('IDENTIFIER', 'speak', null, 1),
							lambdaExpr([], [printStmt(thisExpr)])
						)
					],
					[]
				),
				varStmt(
					new Token('IDENTIFIER', 'method', null, 1),
					getExpr(
						callExpr(
							variableExpr(new Token('IDENTIFIER', 'Egotist', null, 1)),
							new Token('LEFT_PAREN', '(', '(', 1),
							[]
						),
						new Token('IDENTIFIER', 'speak', null, 1)
					)
				),
				expressionStmt(
					callExpr(
						variableExpr(new Token('IDENTIFIER', 'method', null, 1)),
						new Token('LEFT_PAREN', '(', '(', 1),
						[]
					)
				)
			]
			// Emulating resolver for thisExpr
			ctx.locals.set(thisExpr, 1)
			interpret(ctx, stmts)
			verify(spyCtx.runtimeError(anything())).never()
			verify(spyCtx.print('instance of Egotist')).once()
		})

		it('calls an init method when constructing an instance', () => {
			// class Bagel {
			//   init() {
			//     print "Bagel";
			//   }
			// }
			// Bagel(); // prints "Bagel"
			const stmts = [
				classStmt(
					new Token('IDENTIFIER', 'Bagel', null, 1),
					null,
					[
						functionStmt(
							new Token('IDENTIFIER', 'init', null, 1),
							lambdaExpr([], [printStmt(literalExpr('Bagel'))])
						)
					],
					[]
				),
				expressionStmt(
					callExpr(
						variableExpr(new Token('IDENTIFIER', 'Bagel', null, 1)),
						new Token('LEFT_PAREN', '(', '(', 1),
						[]
					)
				)
			]
			interpret(ctx, stmts)
			verify(spyCtx.runtimeError(anything())).never()
			verify(spyCtx.print('Bagel')).once()
		})

		it('returns this from initializer', () => {
			// class Foo {
			//   init() {
			//   }
			// }
			// var foo = Foo();
			// print foo.init(); // prints "instance of Foo"
			const stmts = [
				classStmt(
					new Token('IDENTIFIER', 'Foo', null, 1),
					null,
					[
						functionStmt(
							new Token('IDENTIFIER', 'init', null, 1),
							lambdaExpr([], [])
						)
					],
					[]
				),
				varStmt(
					new Token('IDENTIFIER', 'foo', null, 1),
					callExpr(
						variableExpr(new Token('IDENTIFIER', 'Foo', null, 1)),
						new Token('LEFT_PAREN', '(', '(', 1),
						[]
					)
				),
				printStmt(
					callExpr(
						getExpr(
							variableExpr(new Token('IDENTIFIER', 'foo', null, 1)),
							new Token('IDENTIFIER', 'init', null, 1)
						),
						new Token('LEFT_PAREN', '(', '(', 1),
						[]
					)
				)
			]
			interpret(ctx, stmts)
			verify(spyCtx.runtimeError(anything())).never()
			verify(spyCtx.print('instance of Foo')).once()
		})

		it('calls a function with reference to this', () => {
			// class Thing {
			//   getCallback() {
			//     fun localFunction() {
			//       print this;
			//     }
			//     return localFunction;
			//   }
			// }
			// var callback = Thing().getCallback();
			// callback();
			const localFunctionExpr = variableExpr(
				new Token('IDENTIFIER', 'localFunction', null, 1)
			)
			const thisExpr = variableExpr(new Token('IDENTIFIER', 'this', null, 1))
			const stmts = [
				classStmt(
					new Token('IDENTIFIER', 'Thing', null, 1),
					null,
					[
						functionStmt(
							new Token('IDENTIFIER', 'getCallback', null, 1),
							lambdaExpr(
								[],
								[
									functionStmt(
										new Token('IDENTIFIER', 'localFunction', null, 1),
										lambdaExpr([], [printStmt(thisExpr)])
									),
									returnStmt(
										new Token('RETURN', 'return', null, 1),
										localFunctionExpr
									)
								]
							)
						)
					],
					[]
				),
				varStmt(
					new Token('IDENTIFIER', 'callback', null, 1),
					callExpr(
						getExpr(
							callExpr(
								variableExpr(new Token('IDENTIFIER', 'Thing', null, 1)),
								new Token('LEFT_PAREN', '(', '(', 1),
								[]
							),
							new Token('IDENTIFIER', 'getCallback', null, 1)
						),
						new Token('LEFT_PAREN', '(', '(', 1),
						[]
					)
				),
				expressionStmt(
					callExpr(
						variableExpr(new Token('IDENTIFIER', 'callback', null, 1)),
						new Token('LEFT_PAREN', '(', '(', 1),
						[]
					)
				)
			]
			ctx.locals.set(thisExpr, 2) // Emulating resolver for thisExpr
			ctx.locals.set(localFunctionExpr, 0) // Emulating resolver for localFunctionExpr
			interpret(ctx, stmts)
			verify(spyCtx.runtimeError(anything())).never()
			verify(spyCtx.print('instance of Thing')).once()
		})

		it('runs a static class method', () => {
			// class Foo {
			//   class bar() {
			//     print "bar";
			//   }
			// }
			// Foo.bar(); // prints "bar"
			const stmts = [
				classStmt(
					new Token('IDENTIFIER', 'Foo', null, 1),
					null,
					[],
					[
						functionStmt(
							new Token('IDENTIFIER', 'bar', null, 1),
							lambdaExpr([], [printStmt(literalExpr('bar'))])
						)
					]
				),
				expressionStmt(
					callExpr(
						getExpr(
							variableExpr(new Token('IDENTIFIER', 'Foo', null, 1)),
							new Token('IDENTIFIER', 'bar', null, 1)
						),
						new Token('LEFT_PAREN', '(', '(', 1),
						[]
					)
				)
			]
			interpret(ctx, stmts)
			verify(spyCtx.runtimeError(anything())).never()
			verify(spyCtx.print('bar')).once()
		})

		it('reports an error when superclass is not a class', () => {
			// var bar = 123;
			// class Foo > bar {
			// }
			const stmts = [
				varStmt(new Token('IDENTIFIER', 'bar', null, 1), literalExpr(123)),
				classStmt(
					new Token('IDENTIFIER', 'Foo', null, 1),
					variableExpr(new Token('IDENTIFIER', 'bar', null, 1)),
					[],
					[]
				)
			]
			interpret(ctx, stmts)
			verify(spyCtx.runtimeError(anything())).once()
		})

		it('calls a method defined on a superclass', () => {
			// class Doughnut {
			//   cook() {
			//     print "Fry until golden brown";
			//   }
			// }
			// class BostonCream < Doughnut {}
			// BostonCream().cook(); // prints "Fry until golden brown"
			const stmts = [
				classStmt(
					new Token('IDENTIFIER', 'Doughnut', null, 1),
					null,
					[
						functionStmt(
							new Token('IDENTIFIER', 'cook', null, 1),
							lambdaExpr([], [printStmt(literalExpr('Fry until golden brown'))])
						)
					],
					[]
				),
				classStmt(
					new Token('IDENTIFIER', 'BostonCream', null, 1),
					variableExpr(new Token('IDENTIFIER', 'Doughnut', null, 1)),
					[],
					[]
				),
				expressionStmt(
					callExpr(
						getExpr(
							callExpr(
								variableExpr(new Token('IDENTIFIER', 'BostonCream', null, 1)),
								new Token('LEFT_PAREN', '(', '(', 1),
								[]
							),
							new Token('IDENTIFIER', 'cook', null, 1)
						),
						new Token('LEFT_PAREN', '(', '(', 1),
						[]
					)
				)
			]
			interpret(ctx, stmts)
			verify(spyCtx.runtimeError(anything())).never()
			verify(spyCtx.print('Fry until golden brown')).once()
		})
	
		it('calls a superclass method in override with super keyword', () => {
			// class Doughnut {
			//   cook() {
			//     print "Fry until golden brown";
			//   }
			// }
			// class BostonCream < Doughnut {
			//   cook() {
			//     super.cook();
			//     print "Pipe full of custard and coat with chocolate";
			//   }
			// }
			// BostonCream().cook(); // prints "Fry until golden brown" and "Pipe full of custard and coat with chocolate"
			const stmts = [
				classStmt(
					new Token('IDENTIFIER', 'Doughnut', null, 1),
					null,
					[
						functionStmt(
							new Token('IDENTIFIER', 'cook', null, 1),
							lambdaExpr([], [printStmt(literalExpr('Fry until golden brown'))])
						)
					],
					[]
				),
				classStmt(
					new Token('IDENTIFIER', 'BostonCream', null, 1),
					variableExpr(new Token('IDENTIFIER', 'Doughnut', null, 1)),
					[
						functionStmt(
							new Token('IDENTIFIER', 'cook', null, 1),
							lambdaExpr([], [
								expressionStmt(
									callExpr(
										superExpr(
											new Token('SUPER', 'super', null, 1),
											new Token('IDENTIFIER', 'cook', null, 1),
										),
										new Token('LEFT_PAREN', '(', '(', 1),
										[]
									)
								),
								printStmt(literalExpr('Pipe full of custard and coat with chocolate'))
							])
						)
					],
					[]
				),
				expressionStmt(
					callExpr(
						getExpr(
							callExpr(
								variableExpr(new Token('IDENTIFIER', 'BostonCream', null, 1)),
								new Token('LEFT_PAREN', '(', '(', 1),
								[]
							),
							new Token('IDENTIFIER', 'cook', null, 1)
						),
						new Token('LEFT_PAREN', '(', '(', 1),
						[]
					)
				)
			]
			interpret(ctx, stmts)
			verify(spyCtx.runtimeError(anything())).never()
			verify(spyCtx.print('Fry until golden brown')).once()
			verify(spyCtx.print('Pipe full of custard and coat with chocolate')).once()
		})
	})
})
