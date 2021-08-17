import { Environment } from './environment'
import { Token } from './Token'

describe('environment', () => {
	let env: Environment

	beforeEach(() => {
		env = new Environment()
	})

	describe('define', () => {
		it('defines an undefined variable without assignment', () => {
			env.define(new Token('IDENTIFIER', 'foo', undefined, 1), null)
		})

		it('defines a variable with assignment', () => {
			env.define(new Token('IDENTIFIER', 'foo', undefined, 1), 1)
		})
        
        it('defines a variable shadowing enclosing environment', () => {
            env.define(new Token('IDENTIFIER', 'foo', undefined, 1), 1)
            const childEnv = new Environment(env)
            childEnv.define(new Token('IDENTIFIER', 'foo', undefined, 1), 2)
        })

		it('throws when trying to define a defined unassigned variable', () => {
			env.define(new Token('IDENTIFIER', 'foo', undefined, 1), null)
			expect(() => {
				env.define(new Token('IDENTIFIER', 'foo', undefined, 1), null)
			}).toThrowError('Variable foo already defined')
		})

		it('throws when trying to define a defined assigned variable', () => {
			env.define(new Token('IDENTIFIER', 'foo', undefined, 1), 1)
			expect(() => {
				env.define(new Token('IDENTIFIER', 'foo', undefined, 1), 1)
			}).toThrowError('Variable foo already defined')
		})
	})

	describe('get', () => {
		it('throws when trying to get undefined variable', () => {
			expect(() => {
				env.get(new Token('IDENTIFIER', 'x', undefined, 1))
			}).toThrowError('Undefined variable x')
		})

		it('throws when trying to get unassigned variable', () => {
			env.define(new Token('IDENTIFIER', 'x', undefined, 1), undefined)
			expect(() => {
				env.get(new Token('IDENTIFIER', 'x', undefined, 1))
			}).toThrowError('Unassigned variable x')
		})

		it('returns a variable assigned in enclosing environment', () => {
			env.define(new Token('IDENTIFIER', 'x', undefined, 1), 1)
			const childEnv = new Environment(env)
			const result = childEnv.get(new Token('IDENTIFIER', 'x', undefined, 1))
			expect(result).toEqual(1)
		})
	})

	describe('set', () => {
		it('assigns a defined variable', () => {
			env.define(new Token('IDENTIFIER', 'x', undefined, 1), 1)
			env.assign(new Token('IDENTIFIER', 'x', undefined, 1), 2)
		})

		it('assignes a defined, but unassigned variable', () => {
			env.define(new Token('IDENTIFIER', 'x', undefined, 1), undefined)
			env.assign(new Token('IDENTIFIER', 'x', undefined, 1), 2)
		})

		it('assigns a variable defined in enclosing environment', () => {
			env.define(new Token('IDENTIFIER', 'x', undefined, 1), 1)
			const childEnv = new Environment(env)
			childEnv.assign(new Token('IDENTIFIER', 'x', undefined, 1), 2)
			expect(env.get(new Token('IDENTIFIER', 'x', undefined, 1))).toEqual(2)
		})
	})
})
