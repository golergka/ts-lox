import { thrw } from 'thrw'
import { RuntimeError } from './interpret'
import { Token } from './Token'

export class Environment {
	private readonly values: Map<string, Object | null> = new Map<
		string,
		Object | null
	>()

	public define(name: Token, value: Object | null): void {
		this.values.set(name.lexeme, value)
	}

	public get(name: Token) {
		return (
			this.values.get(name.lexeme) || thrw(`Undefined variable: ${name.lexeme}`)
		)
	}

	public assign(name: Token, value: Object | null) {
		if (this.values.has(name.lexeme)) {
			this.values.set(name.lexeme, value)
		} else {
			throw new RuntimeError(name, `Undefined variable ${name.lexeme}`)
		}
	}

}
