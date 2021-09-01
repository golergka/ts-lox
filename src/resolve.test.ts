import { mock, instance, verify, anything } from 'ts-mockito'
import { binaryExpr, literalExpr, variableExpr } from './generated/Expr'
import { blockStmt, expressionStmt, varStmt } from './generated/Stmt'
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
		const expr = binaryExpr(
			literalExpr(1),
			new Token('PLUS', '+', undefined, 1),
			literalExpr(2)
		)
		resolve(ctx, expr)
		verify(mockedCtx.parserError(anything(), anything())).never()
	})

	it(`doesn't build locals for variable declaration in global scope`, () => {
		const stmts = [
			varStmt(new Token('IDENTIFIER', 'x', undefined, 1), literalExpr(1)),
			expressionStmt(variableExpr(new Token('IDENTIFIER', 'x', undefined, 1)))
		]
		const { locals } = resolve(ctx, stmts)
		expect(locals.size).toBe(0)
	})

	it('builds locals for block-scoped variable declaration', () => {
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

	it('reports an error when variable is accessed in initializer', () => {
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
		const stmts = [
			blockStmt([
				varStmt(new Token('IDENTIFIER', 'x', undefined, 1), literalExpr(1)),
				expressionStmt(variableExpr(new Token('IDENTIFIER', 'y', undefined, 1)))
			])
		]
		resolve(ctx, stmts)
		verify(mockedCtx.parserError(anything(), anything(), anything())).once()
	})
})
