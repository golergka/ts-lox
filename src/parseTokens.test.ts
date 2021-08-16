import {
	assignmentExpr,
	binaryErrorExpr,
	binaryExpr,
	conditionalExpr,
	literalExpr,
	unaryExpr,
	variableExpr
} from './generated/Expr'
import {
	blockStmt,
	expressionStmt,
	printStmt,
	varStmt,
	whileStmt
} from './generated/Stmt'
import { ParserContext, parseTokens } from './parseTokens'
import { Token } from './Token'
import { mock, instance, verify, anything } from 'ts-mockito'

describe(`parseTokens`, () => {
	let mockedCtx: ParserContext
	let ctx: ParserContext

	beforeEach(() => {
		mockedCtx = mock<ParserContext>()
		ctx = instance(mockedCtx)
	})

	describe('allowExpressions: false', () => {
		it('1;', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '1', 1, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([expressionStmt(literalExpr(1))])
			verify(mockedCtx.parserError(anything(), anything())).never()
		})

		it('"a";', () => {
			const tokens: Token[] = [
				new Token('STRING', '"a"', 'a', 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([expressionStmt(literalExpr('a'))])
		})

		it('2+2;', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '2', 2, 1),
				new Token('PLUS', '+', undefined, 1),
				new Token('NUMBER', '2', 2, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				expressionStmt(
					binaryExpr(
						literalExpr(2),
						new Token('PLUS', '+', undefined, 1),
						literalExpr(2)
					)
				)
			])
		})

		it('2+2; without EOF', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '2', 2, 1),
				new Token('PLUS', '+', undefined, 1),
				new Token('NUMBER', '2', 2, 1),
				new Token('SEMICOLON', ';', undefined, 1)
			]

			expect(() => parseTokens(ctx, tokens, false)).toThrow()
		})

		it('1+2+3;', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '1', 1, 1),
				new Token('PLUS', '+', undefined, 1),
				new Token('NUMBER', '2', 2, 1),
				new Token('PLUS', '+', undefined, 1),
				new Token('NUMBER', '3', 3, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				expressionStmt(
					binaryExpr(
						binaryExpr(
							literalExpr(1),
							new Token('PLUS', '+', undefined, 1),
							literalExpr(2)
						),
						new Token('PLUS', '+', undefined, 1),
						literalExpr(3)
					)
				)
			])
		})

		it('*3;', () => {
			const tokens: Token[] = [
				new Token('STAR', '*', undefined, 1),
				new Token('NUMBER', '3', 3, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				expressionStmt(
					binaryErrorExpr(new Token('STAR', '*', undefined, 1), literalExpr(3))
				)
			])
		})

		it('1+2*3;', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '1', 1, 1),
				new Token('PLUS', '+', undefined, 1),
				new Token('NUMBER', '2', 2, 1),
				new Token('STAR', '*', undefined, 1),
				new Token('NUMBER', '3', 3, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				expressionStmt(
					binaryExpr(
						literalExpr(1),
						new Token('PLUS', '+', undefined, 1),
						binaryExpr(
							literalExpr(2),
							new Token('STAR', '*', undefined, 1),
							literalExpr(3)
						)
					)
				)
			])
		})

		it('!!true;', () => {
			const tokens: Token[] = [
				new Token('BANG', '!', undefined, 1),
				new Token('BANG', '!', undefined, 1),
				new Token('TRUE', 'true', true, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				expressionStmt(
					unaryExpr(
						new Token('BANG', '!', undefined, 1),
						unaryExpr(new Token('BANG', '!', undefined, 1), literalExpr(true))
					)
				)
			])
		})

		it('1,2;', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '1', 1, 1),
				new Token('COMMA', ',', undefined, 1),
				new Token('NUMBER', '2', 2, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				expressionStmt(
					binaryExpr(
						literalExpr(1),
						new Token('COMMA', ',', undefined, 1),
						literalExpr(2)
					)
				)
			])
		})

		it('1,2,3;', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '1', 1, 1),
				new Token('COMMA', ',', undefined, 1),
				new Token('NUMBER', '2', 2, 1),
				new Token('COMMA', ',', undefined, 1),
				new Token('NUMBER', '3', 3, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				expressionStmt(
					binaryExpr(
						binaryExpr(
							literalExpr(1),
							new Token('COMMA', ',', undefined, 1),
							literalExpr(2)
						),
						new Token('COMMA', ',', undefined, 1),
						literalExpr(3)
					)
				)
			])
		})

		it('true?1:2;', () => {
			const tokens: Token[] = [
				new Token('TRUE', 'true', true, 1),
				new Token('QUESTION', '?', undefined, 1),
				new Token('NUMBER', '1', 1, 1),
				new Token('COLON', ':', undefined, 1),
				new Token('NUMBER', '2', 2, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				expressionStmt(
					conditionalExpr(literalExpr(true), literalExpr(1), literalExpr(2))
				)
			])
		})

		it('var x=1;', () => {
			const tokens: Token[] = [
				new Token('VAR', 'var', undefined, 1),
				new Token('IDENTIFIER', 'x', undefined, 1),
				new Token('EQUAL', '=', undefined, 1),
				new Token('NUMBER', '1', 1, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				varStmt(new Token('IDENTIFIER', 'x', undefined, 1), literalExpr(1))
			])
		})

		it('var x;', () => {
			const tokens: Token[] = [
				new Token('VAR', 'var', undefined, 1),
				new Token('IDENTIFIER', 'x', undefined, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				varStmt(new Token('IDENTIFIER', 'x', undefined, 1), undefined)
			])
		})

		it('while (true) print "hello world"', () => {
			const tokens: Token[] = [
				new Token('WHILE', 'while', undefined, 1),
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('TRUE', 'true', true, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('PRINT', 'print', undefined, 1),
				new Token('STRING', '"hello world"', 'hello world', 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				whileStmt(literalExpr(true), printStmt(literalExpr('hello world')))
			])
		})

		it('for (var i = 0; i < 10; i = i + 1) print "hello world"', () => {
			const tokens: Token[] = [
				new Token('FOR', 'for', undefined, 1),
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('VAR', 'var', undefined, 1),
				new Token('IDENTIFIER', 'i', undefined, 1),
				new Token('EQUAL', '=', undefined, 1),
				new Token('NUMBER', '0', 0, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('IDENTIFIER', 'i', undefined, 1),
				new Token('LESS', '<', undefined, 1),
				new Token('NUMBER', '10', 10, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('IDENTIFIER', 'i', undefined, 1),
				new Token('EQUAL', '=', undefined, 1),
				new Token('IDENTIFIER', 'i', undefined, 1),
				new Token('PLUS', '+', undefined, 1),
				new Token('NUMBER', '1', 1, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('PRINT', 'print', undefined, 1),
				new Token('STRING', '"hello world"', 'hello world', 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				blockStmt([
					varStmt(new Token('IDENTIFIER', 'i', undefined, 1), literalExpr(0)),
					whileStmt(
						binaryExpr(
							variableExpr(new Token('IDENTIFIER', 'i', undefined, 1)),
							new Token('LESS', '<', undefined, 1),
							literalExpr(10)
						),
						blockStmt([
							printStmt(literalExpr('hello world')),
							expressionStmt(
								assignmentExpr(
									new Token('IDENTIFIER', 'i', undefined, 1),
									binaryExpr(
										variableExpr(new Token('IDENTIFIER', 'i', undefined, 1)),
										new Token('PLUS', '+', undefined, 1),
										literalExpr(1)
									)
								)
							)
						])
					)
				])
			])
		})
	})

	describe('allowExpressions: true', () => {
		it('1', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '1', 1, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(literalExpr(1))
			verify(mockedCtx.parserError(anything(), anything())).never()
		})

		it('"a"', () => {
			const tokens: Token[] = [
				new Token('STRING', '"a"', 'a', 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(literalExpr('a'))
		})

		it('2+2', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '2', 2, 1),
				new Token('PLUS', '+', undefined, 1),
				new Token('NUMBER', '2', 2, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(
				binaryExpr(
					literalExpr(2),
					new Token('PLUS', '+', undefined, 1),
					literalExpr(2)
				)
			)
		})

		it('2+2 without EOF', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '2', 2, 1),
				new Token('PLUS', '+', undefined, 1),
				new Token('NUMBER', '2', 2, 1)
			]

			expect(() => parseTokens(ctx, tokens, true)).toThrow()
		})

		it('1+2+3', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '1', 1, 1),
				new Token('PLUS', '+', undefined, 1),
				new Token('NUMBER', '2', 2, 1),
				new Token('PLUS', '+', undefined, 1),
				new Token('NUMBER', '3', 3, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(
				binaryExpr(
					binaryExpr(
						literalExpr(1),
						new Token('PLUS', '+', undefined, 1),
						literalExpr(2)
					),
					new Token('PLUS', '+', undefined, 1),
					literalExpr(3)
				)
			)
		})

		it('*3', () => {
			const tokens: Token[] = [
				new Token('STAR', '*', undefined, 1),
				new Token('NUMBER', '3', 3, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(
				binaryErrorExpr(new Token('STAR', '*', undefined, 1), literalExpr(3))
			)
		})

		it('1+2*3', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '1', 1, 1),
				new Token('PLUS', '+', undefined, 1),
				new Token('NUMBER', '2', 2, 1),
				new Token('STAR', '*', undefined, 1),
				new Token('NUMBER', '3', 3, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(
				binaryExpr(
					literalExpr(1),
					new Token('PLUS', '+', undefined, 1),
					binaryExpr(
						literalExpr(2),
						new Token('STAR', '*', undefined, 1),
						literalExpr(3)
					)
				)
			)
		})

		it('!!true', () => {
			const tokens: Token[] = [
				new Token('BANG', '!', undefined, 1),
				new Token('BANG', '!', undefined, 1),
				new Token('TRUE', 'true', true, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(
				unaryExpr(
					new Token('BANG', '!', undefined, 1),
					unaryExpr(new Token('BANG', '!', undefined, 1), literalExpr(true))
				)
			)
		})

		it('1,2', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '1', 1, 1),
				new Token('COMMA', ',', undefined, 1),
				new Token('NUMBER', '2', 2, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(
				binaryExpr(
					literalExpr(1),
					new Token('COMMA', ',', undefined, 1),
					literalExpr(2)
				)
			)
		})

		it('1,2,3', () => {
			const tokens: Token[] = [
				new Token('NUMBER', '1', 1, 1),
				new Token('COMMA', ',', undefined, 1),
				new Token('NUMBER', '2', 2, 1),
				new Token('COMMA', ',', undefined, 1),
				new Token('NUMBER', '3', 3, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(
				binaryExpr(
					binaryExpr(
						literalExpr(1),
						new Token('COMMA', ',', undefined, 1),
						literalExpr(2)
					),
					new Token('COMMA', ',', undefined, 1),
					literalExpr(3)
				)
			)
		})

		it('true?1:2', () => {
			const tokens: Token[] = [
				new Token('TRUE', 'true', true, 1),
				new Token('QUESTION', '?', undefined, 1),
				new Token('NUMBER', '1', 1, 1),
				new Token('COLON', ':', undefined, 1),
				new Token('NUMBER', '2', 2, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(
				conditionalExpr(literalExpr(true), literalExpr(1), literalExpr(2))
			)
		})
	})
})
