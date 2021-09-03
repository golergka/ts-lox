import {
	assignmentExpr,
	binaryErrorExpr,
	binaryExpr,
	callExpr,
	conditionalExpr,
	getExpr,
	lambdaExpr,
	literalExpr,
	setExpr,
	thisExpr,
	unaryExpr,
	variableExpr
} from './generated/Expr'
import {
	blockStmt,
	breakErrorStmt,
	breakStmt,
	continueErrorStmt,
	continueStmt,
	expressionStmt,
	ifStmt,
	printStmt,
	varStmt,
	whileStmt,
	functionStmt,
	classStmt,
	returnStmt
} from './generated/Stmt'
import { ParserContext, parseTokens } from './parseTokens'
import { Token } from './token'
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

		it('print "hello world";', () => {
			const tokens: Token[] = [
				new Token('PRINT', 'print', undefined, 1),
				new Token('STRING', '"hello world"', 'hello world', 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([printStmt(literalExpr('hello world'))])
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

		it('while(true) { break; }', () => {
			const tokens: Token[] = [
				new Token('WHILE', 'while', undefined, 1),
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('TRUE', 'true', true, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('LEFT_BRACE', '{', undefined, 1),
				new Token('BREAK', 'break', undefined, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('RIGHT_BRACE', '}', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				whileStmt(
					literalExpr(true),
					blockStmt([breakStmt(new Token('BREAK', 'break', undefined, 1))])
				)
			])
		})

		it('while(true) { continue; }', () => {
			const tokens: Token[] = [
				new Token('WHILE', 'while', undefined, 1),
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('TRUE', 'true', true, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('LEFT_BRACE', '{', undefined, 1),
				new Token('CONTINUE', 'continue', undefined, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('RIGHT_BRACE', '}', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				whileStmt(
					literalExpr(true),
					blockStmt([
						continueStmt(new Token('CONTINUE', 'continue', undefined, 1))
					])
				)
			])
		})

		it('break;', () => {
			const tokens: Token[] = [
				new Token('BREAK', 'break', 'break', 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				breakErrorStmt(new Token('BREAK', 'break', 'break', 1))
			])
			verify(
				mockedCtx.parserError(anything(), anything(), 'Invalid break statement')
			).once()
		})

		it('if (true) { continue; }', () => {
			const tokens: Token[] = [
				new Token('IF', 'if', undefined, 1),
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('TRUE', 'true', true, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('LEFT_BRACE', '{', undefined, 1),
				new Token('CONTINUE', 'continue', undefined, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('RIGHT_BRACE', '}', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				ifStmt(
					literalExpr(true),
					blockStmt([
						continueErrorStmt(new Token('CONTINUE', 'continue', undefined, 1))
					]),
					null
				)
			])
			verify(
				mockedCtx.parserError(
					anything(),
					anything(),
					'Invalid continue statement'
				)
			).once()
		})

		it('fun example() {}', () => {
			const tokens: Token[] = [
				new Token('FUN', 'fun', 'fun', 1),
				new Token('IDENTIFIER', 'example', 'example', 1),
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('LEFT_BRACE', '{', undefined, 1),
				new Token('RIGHT_BRACE', '}', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				functionStmt(
					new Token('IDENTIFIER', 'example', 'example', 1),
					lambdaExpr([], [])
				)
			])
		})

		it('class Breakfast { cook() { print "Frying"; } }', () => {
			const tokens: Token[] = [
				new Token('CLASS', 'class', 'class', 1),
				new Token('IDENTIFIER', 'Breakfast', 'Breakfast', 1),
				new Token('LEFT_BRACE', '{', undefined, 1),
				new Token('IDENTIFIER', 'cook', 'cook', 1),
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('LEFT_BRACE', '{', undefined, 1),
				new Token('PRINT', 'print', undefined, 1),
				new Token('STRING', '"Frying"', 'Frying', 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('RIGHT_BRACE', '}', undefined, 1),
				new Token('RIGHT_BRACE', '}', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				classStmt(
					new Token('IDENTIFIER', 'Breakfast', 'Breakfast', 1),
					null,
					[
						functionStmt(
							new Token('IDENTIFIER', 'cook', 'cook', 1),
							lambdaExpr([], [printStmt(literalExpr('Frying'))])
						)
					],
					[]
				)
			])
		})

		it('class Math { class square(n) { return n * n } }', () => {
			const tokens: Token[] = [
				new Token('CLASS', 'class', 'class', 1),
				new Token('IDENTIFIER', 'Math', 'Math', 1),
				new Token('LEFT_BRACE', '{', undefined, 1),
				new Token('CLASS', 'class', 'class', 1),
				new Token('IDENTIFIER', 'square', 'square', 1),
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('IDENTIFIER', 'n', 'n', 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('LEFT_BRACE', '{', undefined, 1),
				new Token('RETURN', 'return', undefined, 1),
				new Token('IDENTIFIER', 'n', 'n', 1),
				new Token('STAR', '*', undefined, 1),
				new Token('IDENTIFIER', 'n', 'n', 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('RIGHT_BRACE', '}', undefined, 1),
				new Token('RIGHT_BRACE', '}', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				classStmt(
					new Token('IDENTIFIER', 'Math', 'Math', 1),
					null,
					[],
					[
						functionStmt(
							new Token('IDENTIFIER', 'square', 'square', 1),
							lambdaExpr(
								[new Token('IDENTIFIER', 'n', 'n', 1)],
								[
									returnStmt(
										new Token('RETURN', 'return', undefined, 1),
										binaryExpr(
											variableExpr(new Token('IDENTIFIER', 'n', 'n', 1)),
											new Token('STAR', '*', undefined, 1),
											variableExpr(new Token('IDENTIFIER', 'n', 'n', 1))
										)
									)
								]
							)
						)
					]
				)
			])
		})
		
		it('class BostonCream < Doughnut { }', () => {
			const tokens: Token[] = [
				new Token('CLASS', 'class', 'class', 1),
				new Token('IDENTIFIER', 'BostonCream', 'BostonCream', 1),
				new Token('LESS', '<', undefined, 1),
				new Token('IDENTIFIER', 'Doughnut', 'Doughnut', 1),
				new Token('LEFT_BRACE', '{', undefined, 1),
				new Token('RIGHT_BRACE', '}', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, false)
			expect(result).toEqual([
				classStmt(
					new Token('IDENTIFIER', 'BostonCream', 'BostonCream', 1),
					variableExpr(new Token('IDENTIFIER', 'Doughnut', 'Doughnut', 1)),
					[],
					[]
				)
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

		it('fun() {}', () => {
			const tokens: Token[] = [
				new Token('FUN', 'function', undefined, 1),
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('LEFT_BRACE', '{', undefined, 1),
				new Token('RIGHT_BRACE', '}', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(lambdaExpr([], []))
		})

		it('fun() { print "hello world"; }', () => {
			const tokens: Token[] = [
				new Token('FUN', 'function', undefined, 1),
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('LEFT_BRACE', '{', undefined, 1),
				new Token('PRINT', 'print', undefined, 1),
				new Token('STRING', '"hello world"', 'hello world', 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('RIGHT_BRACE', '}', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(
				lambdaExpr([], [printStmt(literalExpr('hello world'))])
			)
		})

		it('someObject.someProperty', () => {
			const tokens: Token[] = [
				new Token('IDENTIFIER', 'someObject', null, 1),
				new Token('DOT', '.', undefined, 1),
				new Token('IDENTIFIER', 'someProperty', null, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(
				getExpr(
					variableExpr(new Token('IDENTIFIER', 'someObject', null, 1)),
					new Token('IDENTIFIER', 'someProperty', null, 1)
				)
			)
		})

		it('egg.scramble(3).with(cheddar)', () => {
			const tokens: Token[] = [
				new Token('IDENTIFIER', 'egg', null, 1),
				new Token('DOT', '.', undefined, 1),
				new Token('IDENTIFIER', 'scramble', null, 1),
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('NUMBER', '3', 3, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('DOT', '.', undefined, 1),
				new Token('IDENTIFIER', 'with', null, 1),
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('IDENTIFIER', 'cheddar', null, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(
				callExpr(
					getExpr(
						callExpr(
							getExpr(
								variableExpr(new Token('IDENTIFIER', 'egg', null, 1)),
								new Token('IDENTIFIER', 'scramble', null, 1)
							),
							new Token('RIGHT_PAREN', ')', undefined, 1),
							[literalExpr(3)]
						),
						new Token('IDENTIFIER', 'with', null, 1)
					),
					new Token('RIGHT_PAREN', ')', undefined, 1),
					[variableExpr(new Token('IDENTIFIER', 'cheddar', null, 1))]
				)
			)
		})

		it('breakfast.omelette.filling.meat = ham', () => {
			const tokens: Token[] = [
				new Token('IDENTIFIER', 'breakfast', null, 1),
				new Token('DOT', '.', undefined, 1),
				new Token('IDENTIFIER', 'omelette', null, 1),
				new Token('DOT', '.', undefined, 1),
				new Token('IDENTIFIER', 'filling', null, 1),
				new Token('DOT', '.', undefined, 1),
				new Token('IDENTIFIER', 'meat', null, 1),
				new Token('EQUAL', '=', undefined, 1),
				new Token('IDENTIFIER', 'ham', null, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(
				setExpr(
					getExpr(
						getExpr(
							variableExpr(new Token('IDENTIFIER', 'breakfast', null, 1)),
							new Token('IDENTIFIER', 'omelette', null, 1)
						),
						new Token('IDENTIFIER', 'filling', null, 1)
					),
					new Token('IDENTIFIER', 'meat', null, 1),
					variableExpr(new Token('IDENTIFIER', 'ham', null, 1))
				)
			)
		})

		it('this', () => {
			const tokens: Token[] = [
				new Token('THIS', 'this', undefined, 1),
				new Token('EOF', '', undefined, 1)
			]
			const result = parseTokens(ctx, tokens, true)
			expect(result).toEqual(thisExpr(new Token('THIS', 'this', undefined, 1)))
		})
	})
})
