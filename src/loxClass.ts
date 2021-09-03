import { Callable } from "./callable";
import { InterpreterContext } from "./interpret";
import { LoxFunction } from "./loxFunction";
import { LoxInstance } from "./loxInstance";

let metaKlass: LoxClass

export class LoxClass extends LoxInstance implements Callable {
	public constructor(
		public readonly name: string,
		public readonly methods: Map<string, LoxFunction>,
		public readonly staticMethods: Map<string, LoxFunction>
	) {
		super(metaKlass)
		for (const [name, method] of staticMethods) {
			this.fields.set(name, method)
		}
	}

	call(ctx: InterpreterContext, args: (Object | null)[]): Object | null {
		const instance = new LoxInstance(this)
		const initializer = this.findMethod("init")
		if (initializer !== undefined) {
			initializer.bind(instance).call(ctx, args)
		}
		return instance
	}

	get arity(): number {
		const initializer = this.findMethod("init")
		return initializer?.arity || 0
	}

	public toString(): string {
		return this.name
	}

    public findMethod(name: string): LoxFunction | undefined {
		return this.methods.get(name)
    }
}

metaKlass = new LoxClass("Class", new Map(), new Map())