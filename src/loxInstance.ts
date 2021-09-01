import { RuntimeError } from "./interpret";
import { LoxClass } from "./loxClass";
import { Token } from "./token";

export class LoxInstance {
    private readonly fields: Map<string, object|null> = new Map()

    public constructor(private readonly klass: LoxClass) {}
    
    public toString(): string {
        return `instance of ${this.klass.name}`;
    }

	public get(name: Token): Object | null {
        const value = this.fields.get(name.lexeme)
        if (value !== undefined) {
            return value
        }
		throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`)
	}
}