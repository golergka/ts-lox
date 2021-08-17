import { mock, instance } from 'ts-mockito'
import { ParserContext } from './parseTokens'
import { scan } from './scan'
import { Token } from './token'
import { TokenType } from './tokenType'

describe('Scanner', () => {
	let mockedCtx: ParserContext
	let ctx: ParserContext
	
	beforeEach(() => {
		mockedCtx = mock<ParserContext>()
		ctx = instance(mockedCtx)
	})

	describe('Single tokens', () => {
		function testSingleToken(input: string, type: TokenType, literal: any) {
			it(input, () => {
				const tokens = scan(ctx, input)
				expect(tokens).toEqual([
					new Token(type, input, literal, 1),
					new Token('EOF', '', undefined, 1)
				])
			})
		}

		testSingleToken('(', 'LEFT_PAREN', undefined)
		testSingleToken('2', 'NUMBER', 2)
		testSingleToken('a', 'IDENTIFIER', 'a')
		testSingleToken('true', 'TRUE', true)
		testSingleToken('?', 'QUESTION', undefined)
		testSingleToken(':', 'COLON', undefined)
	})

	it('', () => {
		const tokens = scan(ctx, '')
		expect(tokens).toEqual([new Token('EOF', '', undefined, 1)])
	})

	describe('line comments', () => {
		it('(\\n//abc\\n)', () => {
			const tokens = scan(ctx, '(\n' + '//abc\n' + ')')
			expect(tokens).toEqual([
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('RIGHT_PAREN', ')', undefined, 3),
				new Token('EOF', '', undefined, 3)
			])
		})
	})

	describe('string', () => {
		it('"abc"', () => {
			const tokens = scan(ctx, '"abc"')
			expect(tokens).toEqual([
				new Token('STRING', '"abc"', 'abc', 1),
				new Token('EOF', '', undefined, 1)
			])
		})
	})

	describe('block comments', () => {
		it('(/*abc*/)', () => {
			const tokens = scan(ctx, '(/*abc*/)')
			expect(tokens).toEqual([
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('EOF', '', undefined, 1)
			])
		})
		it('(/*abc*/', () => {
			const tokens = scan(ctx, '(/*abc*/')
			expect(tokens).toEqual([
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('EOF', '', undefined, 1)
			])
		})
	})

	it('true?1:2', () => {
		const tokens = scan(ctx, 'true?1:2')
		expect(tokens).toEqual([
			new Token('TRUE', 'true', true, 1),
			new Token('QUESTION', '?', undefined, 1),
			new Token('NUMBER', '1', 1, 1),
			new Token('COLON', ':', undefined, 1),
			new Token('NUMBER', '2', 2, 1),
			new Token('EOF', '', undefined, 1)
		])
	})
	
	describe('expression statement', () => {
		it('true;', () => {	
			const tokens = scan(ctx, 'true;')
			expect(tokens).toEqual([
				new Token('TRUE', 'true', true, 1),
				new Token('SEMICOLON', ';', undefined, 1),
				new Token('EOF', '', undefined, 1)
			])	
		})
	})
	
	it('break;', () => {
		const tokens = scan(ctx, 'break;')
		expect(tokens).toEqual([
			new Token('BREAK', 'break', 'break', 1),
			new Token('SEMICOLON', ';', undefined, 1),
			new Token('EOF', '', undefined, 1)
		])	
	})
})