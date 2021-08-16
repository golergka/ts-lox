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
})