import { scanTokens } from './scanTokens'
import { Token } from './Token'
import { TokenType } from './TokenType'

describe('Scanner', () => {
	describe('Single tokens', () => {
		function testSingleToken(input: string, type: TokenType, literal: any) {
			it(input, () => {
				const tokens = scanTokens(input)
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
		const tokens = scanTokens('')
		expect(tokens).toEqual([new Token('EOF', '', undefined, 1)])
	})

	describe('line comments', () => {
		it('(\\n//abc\\n)', () => {
			const tokens = scanTokens('(\n' + '//abc\n' + ')')
			expect(tokens).toEqual([
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('RIGHT_PAREN', ')', undefined, 3),
				new Token('EOF', '', undefined, 3)
			])
		})
	})

	describe('string', () => {
		it('"abc"', () => {
			const tokens = scanTokens('"abc"')
			expect(tokens).toEqual([
				new Token('STRING', '"abc"', 'abc', 1),
				new Token('EOF', '', undefined, 1)
			])
		})
	})

	describe('block comments', () => {
		it('(/*abc*/)', () => {
			const tokens = scanTokens('(/*abc*/)')
			expect(tokens).toEqual([
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('EOF', '', undefined, 1)
			])
		})
		it('(/*abc*/', () => {
			const tokens = scanTokens('(/*abc*/')
			expect(tokens).toEqual([
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('EOF', '', undefined, 1)
			])
		})
	})

	it('true?1:2', () => {
		const tokens = scanTokens('true?1:2')
		expect(tokens).toEqual([
			new Token('TRUE', 'true', true, 1),
			new Token('QUESTION', '?', undefined, 1),
			new Token('NUMBER', '1', 1, 1),
			new Token('COLON', ':', undefined, 1),
			new Token('NUMBER', '2', 2, 1),
			new Token('EOF', '', undefined, 1)
		])
	})
})
