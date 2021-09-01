import { Callable } from "./callable";
import { InterpreterContext } from "./interpret";
import { LoxInstance } from "./loxInstance";

export class LoxClass implements Callable {
	public constructor(public readonly name: string) {}

	call(ctx: InterpreterContext, args: (Object | null)[]): Object | null {
		const instance = new LoxInstance(this)
		return instance
	}

	get arity(): number {
		return 0
	}

	public toString(): string {
		return this.name
	}
}
