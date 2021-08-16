import { thrw } from 'thrw'
import { Token } from './Token'

export class Environment {
	private readonly values: Map<string, Object | null> = new Map<
		string,
		Object | null
	>()

	public define(name: string, value: Object | null): void {
		this.values.set(name, value)
	}

	public get(name: Token) {
		return (
			this.values.get(name.lexeme) || thrw(`Undefined variable: ${name.lexeme}`)
		)
	}
}
