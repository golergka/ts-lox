import { thrw } from 'thrw'
import { RuntimeError } from './interpret'
import { Token } from './Token'

export class Environment {
	private readonly values: Map<string, Object | null | undefined> = new Map<
		string,
		Object | null | undefined
	>()

	public constructor(private readonly enclosing: Environment | null = null) {}

	public define(name: Token, value: Object | null | undefined): void {
		if (this.values.has(name.lexeme)) {
			throw new RuntimeError(name, `Variable ${name.lexeme} already defined`)
		}
		this.values.set(name.lexeme, value)
	}

	public get(name: Token): Object|null {
		if (this.values.has(name.lexeme)) {
			const value = this.values.get(name.lexeme)
			if (value === undefined) {
				throw new RuntimeError(name, `Unassigned variable ${name.lexeme}`)
			}
			return value
		} else if (this.enclosing !== null) {
			return this.enclosing.get(name)
		} else {
			throw new RuntimeError(name, `Undefined variable ${name.lexeme}`)
		}
	}

	public assign(name: Token, value: Object | null): void {
		if (this.values.has(name.lexeme)) {
			this.values.set(name.lexeme, value)
		} else if (this.enclosing !== null) {
			return this.enclosing.assign(name, value)
		} else {
			throw new RuntimeError(name, `Undefined variable ${name.lexeme}`)
		}
	}
}
