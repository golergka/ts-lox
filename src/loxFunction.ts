import { Callable } from './callable'
import { Environment } from './environment'
import { LambdaExpr } from './generated/Expr'
import { executeBlock, InterpreterContext, Return } from './interpret'
import { LoxInstance } from './loxInstance'

export class LoxFunction implements Callable {
	public constructor(
		private readonly declaration: LambdaExpr,
		private readonly closure: Environment,
		private readonly isInitializer: boolean
	) { }

	public call(ctx: InterpreterContext, args: (Object | null)[]): Object | null {
		const environment = new Environment(this.closure)
		this.declaration.params.forEach((p, index) =>
			environment.define(p, args[index])
		)
		const prevEnvironment = ctx.environment
		ctx.environment = environment
		try {
			executeBlock(ctx, this.declaration.body)
			if (this.isInitializer) {
				return ctx.environment.getAt(1, 'this')
			}
		} catch (e) {
			if (e instanceof Return) {
				return e.value
			} else {
				throw e
			}
		} finally {
			ctx.environment = prevEnvironment
		}
		return null
	}

	public get arity(): number {
		return this.declaration.params.length
	}

	public bind(instance: LoxInstance): LoxFunction {
		const environment = new Environment(this.closure)
		environment.define('this', instance)
		return new LoxFunction(this.declaration, environment, this.isInitializer)
	}
}
