import { Environment } from "./environment"
import { Token } from "./Token"

describe('environment', () => {
    let env: Environment
    
    beforeEach(() => {
        env = new Environment()
    })

    it('assigns a defined variable', () => {
        env.define(new Token('IDENTIFIER', 'x', undefined, 1), 1)
        env.assign(new Token('IDENTIFIER', 'x', undefined, 1), 2)
    })
    
    it('assignes a defined, but unassigned variable', () => {
        env.define(new Token('IDENTIFIER', 'x', undefined, 1), undefined)
        env.assign(new Token('IDENTIFIER', 'x', undefined, 1), 2)
    })
    
    it('throws when trying to access undefined variable', () => {
        expect(() => {
            env.get(new Token('IDENTIFIER', 'x', undefined, 1))
        }).toThrowError('Undefined variable x')
    })
    
    it('throws when trying to access unassigned variable', () => {
        env.define(new Token('IDENTIFIER', 'x', undefined, 1), undefined)
        expect(() => {
            env.get(new Token('IDENTIFIER', 'x', undefined, 1))
        }).toThrowError('Unassigned variable x')
    })
})