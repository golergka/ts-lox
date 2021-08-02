import { scanTokens } from './scanTokens'
import { Token } from './Token'

describe('Scanner', () => {
	it('single token', () => {
		const tokens = scanTokens('(')
		expect(tokens).toEqual([
			new Token('LEFT_PAREN', '(', undefined, 1),
			new Token('EOF', '', undefined, 1)
		])
	})

	it('empty string', () => {
		const tokens = scanTokens('')
		expect(tokens).toEqual([new Token('EOF', '', undefined, 1)])
	})

	it('numbers', () => {
		const tokens = scanTokens('2')
		expect(tokens).toEqual([
			new Token('NUMBER', '2', 2, 1),
			new Token('EOF', '', undefined, 1)
		])
	})

	it('true literal', () => {
		const tokens = scanTokens('true')
		expect(tokens).toEqual([
			new Token('TRUE', 'true', true, 1),
			new Token('EOF', '', undefined, 1)
		])
	})

	describe('line comments', () => {
		it('inbetween tokens', () => {
			const tokens = scanTokens('(\n' + '//abc\n' + ')')
			expect(tokens).toEqual([
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('RIGHT_PAREN', ')', undefined, 3),
				new Token('EOF', '', undefined, 3)
			])
		})
	})

	describe('block comments', () => {
		it('inbetween tokens', () => {
			const tokens = scanTokens('(/*abc*/)')
			expect(tokens).toEqual([
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('EOF', '', undefined, 1)
			])
		})
		it('after tokens', () => {
			const tokens = scanTokens('(/*abc*/')
			expect(tokens).toEqual([
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('EOF', '', undefined, 1)
			])
		})
	})

	describe('identifier', () => {
		it(`on it's own`, () => {
			const tokens = scanTokens('identifier')
			expect(tokens).toEqual([
				new Token('IDENTIFIER', 'identifier', undefined, 1),
				new Token('EOF', '', undefined, 1)
			])
		})
	})
})
