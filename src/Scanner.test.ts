import { Scanner } from './Scanner'
import { Token } from './Token'

describe('Scanner', () => {
	it('scans single token', () => {
		const scanner = new Scanner('(')
		const tokens = scanner.scanTokens()
		expect(tokens).toEqual([
			new Token('LEFT_PAREN', '(', undefined, 1),
			new Token('EOF', '', undefined, 1)
		])
	})

	describe('line comments', () => {
		it('inbetween tokens', () => {
			const scanner = new Scanner('(\n' + '//abc\n' + ')')
			const tokens = scanner.scanTokens()
			expect(tokens).toEqual([
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('RIGHT_PAREN', ')', undefined, 3),
				new Token('EOF', '', undefined, 3)
			])
		})
	})

	describe('block comments', () => {
		it('inbetween tokens', () => {
			const scanner = new Scanner('(/*abc*/)')
			const tokens = scanner.scanTokens()
			expect(tokens).toEqual([
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('RIGHT_PAREN', ')', undefined, 1),
				new Token('EOF', '', undefined, 1)
			])
		})
		it('after tokens', () => {
			const scanner = new Scanner('(/*abc*/')
			const tokens = scanner.scanTokens()
			expect(tokens).toEqual([
				new Token('LEFT_PAREN', '(', undefined, 1),
				new Token('EOF', '', undefined, 1)
			])
		})
	})

	describe('identifier', () => {
		it(`on it's own`, () => {
			const scanner = new Scanner('identifier')
			const tokens = scanner.scanTokens()
			expect(tokens).toEqual([
				new Token('IDENTIFIER', 'identifier', undefined, 1),
				new Token('EOF', '', undefined, 1)
			])
		})
	})
})
