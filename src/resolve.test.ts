import { mock, instance, verify, anything } from 'ts-mockito'
import {
	binaryExpr,
	callExpr,
	lambdaExpr,
	literalExpr,
	superExpr,
	thisExpr,
	variableExpr
} from './generated/Expr'
import {
	blockStmt,
	classStmt,
	expressionStmt,
	functionStmt,
	printStmt,
	returnStmt,
	varStmt
} from './generated/Stmt'
import { ParserContext } from './parseTokens'
import { resolve } from './resolve'
import { Token } from './token'

describe('resolve', () => {
	let mockedCtx: ParserContext
	let ctx: ParserContext

	beforeEach(() => {
		mockedCtx = mock<ParserContext>()
		ctx = instance(mockedCtx)
	})

	it('returns no errors on simple expression', () => {
		// 1 + 2
		const expr = binaryExpr(
			literalExpr(1),
			new Token('PLUS', '+', undefined, 1),
			literalExpr(2)
		)
		resolve(ctx, expr)
		verify(mockedCtx.parserError(anything(), anything())).never()
	})

	it(`doesn't build locals for variable declaration in global scope`, () => {
		// var x = 1;
		// x;
		const stmts = [
			varStmt(new Token('IDENTIFIER', 'x', undefined, 1), literalExpr(1)),
			expressionStmt(variableExpr(new Token('IDENTIFIER', 'x', undefined, 1)))
		]
		const { locals } = resolve(ctx, stmts)
		expect(locals.size).toBe(0)
	})

	it('builds locals for block-scoped variable declaration', () => {
		// var x = 1;
		// x;
		const varExpr = variableExpr(new Token('IDENTIFIER', 'x', undefined, 1))
		const stmts = [
			blockStmt([
				varStmt(new Token('IDENTIFIER', 'x', undefined, 1), literalExpr(1)),
				expressionStmt(varExpr)
			])
		]
		const { locals } = resolve(ctx, stmts)
		expect(locals.get(varExpr)).toBe(0)
	})

	it('builds locals for variable one block deeper', () => {
		// {
		//   var x = 1;
		//   x;
		// }
		const varExpr = variableExpr(new Token('IDENTIFIER', 'x', undefined, 1))
		const stmts = [
			blockStmt([
				blockStmt([
					varStmt(new Token('IDENTIFIER', 'x', undefined, 1), literalExpr(1)),
					blockStmt([expressionStmt(varExpr)])
				])
			])
		]
		const { locals } = resolve(ctx, stmts)
		expect(locals.get(varExpr)).toBe(1)
	})

	it('reports an error when a variable with the same name is declared twice', () => {
		// var x = 1;
		// var x = 1;
		const stmts = [
			blockStmt([
				varStmt(new Token('IDENTIFIER', 'x', undefined, 1), literalExpr(1)),
				varStmt(new Token('IDENTIFIER', 'x', undefined, 1), literalExpr(1))
			])
		]
		resolve(ctx, stmts)
		// One error for second declaration, another for not using the variable
		verify(mockedCtx.parserError(anything(), anything(), anything())).twice()
	})

	it('reports an error when this is used in global scope', () => {
		// print this;
		const stmts = [printStmt(thisExpr(new Token('THIS', 'this', undefined, 1)))]
		resolve(ctx, stmts)
		verify(mockedCtx.parserError(anything(), anything(), anything())).once()
	})

	it('reports an error when this is used in a regular function', () => {
		// fun notAMethod() {
		//   print this;
		// }
		const stmts = [
			functionStmt(
				new Token('IDENTIFIER', 'notAMethod', undefined, 1),
				lambdaExpr(
					[],
					[printStmt(thisExpr(new Token('IDENTIFIER', 'this', undefined, 1)))]
				)
			)
		]
		resolve(ctx, stmts)
		verify(mockedCtx.parserError(anything(), anything(), anything())).once()
	})

	it('reports an error when variable is accessed in initializer', () => {
		// {
		//   var x = x;
		// }
		const stmts = [
			blockStmt([
				varStmt(
					new Token('IDENTIFIER', 'x', undefined, 1),
					variableExpr(new Token('IDENTIFIER', 'x', undefined, 1))
				)
			])
		]
		resolve(ctx, stmts)
		verify(mockedCtx.parserError(anything(), anything(), anything())).once()
	})

	it('reports an error when a variable is never used', () => {
		// {
		//   var x = 1;
		// }
		const stmts = [
			blockStmt([
				varStmt(new Token('IDENTIFIER', 'x', undefined, 1), literalExpr(1)),
				expressionStmt(variableExpr(new Token('IDENTIFIER', 'y', undefined, 1)))
			])
		]
		resolve(ctx, stmts)
		verify(mockedCtx.parserError(anything(), anything(), anything())).once()
	})

	it(`doesn't report an error for an unused global variable`, () => {
		// var x = 1;
		const stmts = [
			varStmt(new Token('IDENTIFIER', 'x', undefined, 1), literalExpr(1))
		]
		resolve(ctx, stmts)
		verify(mockedCtx.parserError(anything(), anything())).never()
	})

	it(`doesn't report an error for an unused class in global scope`, () => {
		// class Foo {}
		const stmts = [
			classStmt(new Token('IDENTIFIER', 'Foo', undefined, 1), null, [], [])
		]
		resolve(ctx, stmts)
		verify(mockedCtx.parserError(anything(), anything())).never()
	})

	it('reports an error when return statement is used inside an initializer', () => {
		// class Foo {
		//   init() {
		//     return "something else";
		//   }
		// }
		const stmts = [
			classStmt(
				new Token('IDENTIFIER', 'Foo', undefined, 1),
				null,
				[
					functionStmt(
						new Token('IDENTIFIER', 'init', undefined, 1),
						lambdaExpr(
							[],
							[
								returnStmt(
									new Token('RETURN', 'return', undefined, 1),
									literalExpr('something else')
								)
							]
						)
					)
				],
				[]
			)
		]
		resolve(ctx, stmts)
		verify(mockedCtx.parserError(anything(), anything(), anything())).once()
	})

	it('builds locals for this inside a class method', () => {
		// class Egotist {
		//   speak() {
		//     print this;
		//   }
		// }
		const varExpr = variableExpr(new Token('IDENTIFIER', 'this', null, 1))
		const stmts = [
			classStmt(
				new Token('IDENTIFIER', 'Egotist', null, 1),
				null,
				[
					functionStmt(
						new Token('IDENTIFIER', 'speak', null, 1),
						lambdaExpr([], [printStmt(varExpr)])
					)
				],
				[]
			)
		]
		const { locals } = resolve(ctx, stmts)
		expect(locals.get(varExpr)).toBe(1)
	})

	it('builds locals for a function definition', () => {
		// class Thing {
		//   getCallback() {
		//     fun localFunction() {
		//     }
		//     return localFunction;
		//   }
		// }
		const localFunctionExpr = variableExpr(
			new Token('IDENTIFIER', 'localFunction', null, 1)
		)
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
									lambdaExpr([], [])
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
			)
		]
		const { locals } = resolve(ctx, stmts)
		expect(locals.get(localFunctionExpr)).toBe(0)
	})

	it("reports an error when a class is used as it's own superclass", () => {
		// class Oops < Oops {}
		const stmts = [
			classStmt(
				new Token('IDENTIFIER', 'Oops', null, 1),
				variableExpr(new Token('IDENTIFIER', 'Oops', null, 1)),
				[],
				[]
			)
		]
		resolve(ctx, stmts)
		verify(mockedCtx.parserError(anything(), anything(), anything())).once()
	})

	it('resolves a super keyword', () => {
		// class Doughnut {
		//   cook() {
		//     print "Fry until golden brown";
		//   }
		// }
		// class BostonCream < Doughnut {
		//   cook() {
		//     super.cook();
		//   }
		// }

		// I got this girl and she wants me to duke her
		// I told he I'd scoop her around 8 and she said
		const spr = superExpr(
			// That sounds great, surely girls' a trooper
			// Whatever I need her do to she is like
			new Token('SUPER', 'super', null, 1),
			new Token('IDENTIFIER', 'cook', null, 1)
		)
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
						lambdaExpr(
							[],
							[
								expressionStmt(
									callExpr(
										// On his own throne, the boss like King Kupah
										// On the microphone, he flossed the ring
										spr,
										new Token('LEFT_PAREN', '(', null, 1), [])
								)
							]
						)
					)
				],
				[]
			)
		]
		const { locals } = resolve(ctx, stmts)
		verify(mockedCtx.parserError(anything(), anything(), anything())).never()
		expect(locals.get(spr)).toBe(2)
	})
})
