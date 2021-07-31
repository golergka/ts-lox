import { scanTokens } from './scanTokens'
import { Token } from './Token'

describe('Scanner', () => {
	it('scans single token', () => {
		const tokens = scanTokens('(')
		expect(tokens).toEqual([
			new Token('LEFT_PAREN', '(', undefined, 1),
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
