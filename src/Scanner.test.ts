import { Scanner } from "./Scanner"
import { Token } from "./Token"

describe('Scanner', () => {
    it('scans (', () => {
        const scanner = new Scanner('(')
        const tokens = scanner.scanTokens()
        expect(tokens).toEqual([
            new Token('LEFT_PAREN', '(', undefined, 1),
            new Token('EOF', '', undefined, 1)
        ])
    })
})