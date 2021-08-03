import { evaluate } from './interpretExpr'
import { parseTokens } from './parseTokens'
import { scanTokens } from './scanTokens'

describe('evaluate', () => {
	describe(`literals`, () => {
		it(`true`, () => {
			const tokens = scanTokens(`true`)
			const expr = parseTokens(tokens)!
			const result = evaluate(expr)
			expect(result).toEqual(true)
		})
	})

	describe(`binary operations`, () => {
		it('1+1', () => {
			const tokens = scanTokens(`1+1`)
			const expr = parseTokens(tokens)!
			const result = evaluate(expr)
			expect(result).toEqual(2)
		})

		it(`1+1+1`, () => {
			const tokens = scanTokens(`1+1+1`)
			const expr = parseTokens(tokens)!
			const result = evaluate(expr)
			expect(result).toEqual(3)
		})

		it(`1>2`, () => {
			const tokens = scanTokens(`1>2`)
			const expr = parseTokens(tokens)!
			const result = evaluate(expr)
			expect(result).toEqual(false)
		})
	})

	describe(`conditional operator`, () => {
		it(`true?1:2`, () => {
			const tokens = scanTokens(`true?1:2`)
			const expr = parseTokens(tokens)!
			const result = evaluate(expr)
			expect(result).toEqual(1)
		})

		it(`1<3?5:3`, () => {
			const tokens = scanTokens(`1<3?5:3`)
			const expr = parseTokens(tokens)!
			const result = evaluate(expr)
			expect(result).toEqual(5)
		})
	})

	describe(`grouping`, () => {
		it(`(true)`, () => {
			const tokens = scanTokens(`(true)`)
			const expr = parseTokens(tokens)!
			const result = evaluate(expr)
			expect(result).toEqual(true)
		})
        
        it(`(1<3)?5:4`, () => {
            const tokens = scanTokens(`(1<3)?5:4`)
            const expr = parseTokens(tokens)!
            const result = evaluate(expr)
            expect(result).toEqual(5)
        })
	})
})
