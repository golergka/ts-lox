import { binaryErrorExpr, binaryExpr, conditionalExpr, literalExpr, unaryExpr } from './generated/Expr'
import { expressionStmt } from './generated/Stmt'
import { ParserContext, parseTokens } from './parseTokens'
import { scan } from './scan'
import { Token } from './Token'
import { mock, instance, verify, anything } from 'ts-mockito'

describe(`parseTokens`, () => {
	let mockedCtx: ParserContext
	let ctx: ParserContext
	
	beforeEach(() => {
		mockedCtx = mock<ParserContext>()
		ctx = instance(mockedCtx)
	})

	it('1;', () => {
		const tokens: Token[] = [
			new Token('NUMBER', '1', 1, 1),
			new Token('SEMICOLON', ';', undefined, 1),
			new Token('EOF', '', undefined, 1)
		]
		const result = parseTokens(ctx, tokens)
		expect(result).toEqual([expressionStmt(literalExpr(1))])
		verify(mockedCtx.parserError(anything(), anything())).never()
	})

	it('"a";', () => {
		const tokens: Token[] = [
			new Token('STRING', '"a"', 'a', 1),
			new Token('SEMICOLON', ';', undefined, 1),
			new Token('EOF', '', undefined, 1)
		]
		const result = parseTokens(ctx, tokens)
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
		const result = parseTokens(ctx, tokens)
		expect(result).toEqual([expressionStmt(
			binaryExpr(
				literalExpr(2),
				new Token('PLUS', '+', undefined, 1),
				literalExpr(2)
			)
		)])
	})

	it('2+2; without EOF', () => {
		const tokens: Token[] = [
			new Token('NUMBER', '2', 2, 1),
			new Token('PLUS', '+', undefined, 1),
			new Token('NUMBER', '2', 2, 1),
			new Token('SEMICOLON', ';', undefined, 1)
		]

		expect(() => parseTokens(ctx, tokens)).toThrow()
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
		const result = parseTokens(ctx, tokens)
		expect(result).toEqual([expressionStmt(
			binaryExpr(
				binaryExpr(
					literalExpr(1),
					new Token('PLUS', '+', undefined, 1),
					literalExpr(2)
				),
				new Token('PLUS', '+', undefined, 1),
				literalExpr(3)
			)
		)])
	})
	
	it('*3;', () => {
		const tokens: Token[] = [
			new Token('STAR', '*', undefined, 1),
			new Token('NUMBER', '3', 3, 1),
			new Token('SEMICOLON', ';', undefined, 1),
			new Token('EOF', '', undefined, 1)
		]
		const result = parseTokens(ctx, tokens)
		expect(result).toEqual([expressionStmt(
			binaryErrorExpr(
				new Token('STAR', '*', undefined, 1),
				literalExpr(3)
			)
		)])
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
		const result = parseTokens(ctx, tokens)
		expect(result).toEqual([expressionStmt(
			binaryExpr(
				literalExpr(1),
				new Token('PLUS', '+', undefined, 1),
				binaryExpr(
					literalExpr(2),
					new Token('STAR', '*', undefined, 1),
					literalExpr(3)
				)
			)
		)])
	})

	it('!!true;', () => {
		const tokens: Token[] = [
			new Token('BANG', '!', undefined, 1),
			new Token('BANG', '!', undefined, 1),
			new Token('TRUE', 'true', true, 1),
			new Token('SEMICOLON', ';', undefined, 1),
			new Token('EOF', '', undefined, 1)
		]
		const result = parseTokens(ctx, tokens)
		expect(result).toEqual([expressionStmt(
			unaryExpr(
				new Token('BANG', '!', undefined, 1),
				unaryExpr(new Token('BANG', '!', undefined, 1), literalExpr(true))
			)
		)])
	})

	it('1,2;', () => {
		const tokens: Token[] = [
			new Token('NUMBER', '1', 1, 1),
			new Token('COMMA', ',', undefined, 1),
			new Token('NUMBER', '2', 2, 1),
			new Token('SEMICOLON', ';', undefined, 1),
			new Token('EOF', '', undefined, 1)
		]
		const result = parseTokens(ctx, tokens)
		expect(result).toEqual([expressionStmt(
			binaryExpr(
				literalExpr(1),
				new Token('COMMA', ',', undefined, 1),
				literalExpr(2)
			)
		)])
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
		const result = parseTokens(ctx, tokens)
		expect(result).toEqual([expressionStmt(
			binaryExpr(
				binaryExpr(
					literalExpr(1),
					new Token('COMMA', ',', undefined, 1),
					literalExpr(2)
				),
				new Token('COMMA', ',', undefined, 1),
				literalExpr(3)
			)
		)])
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
		const result = parseTokens(ctx, tokens)
		expect(result).toEqual([expressionStmt(
			conditionalExpr(
				literalExpr(true),
				literalExpr(1),
				literalExpr(2),
			)
		)])
	})
})
