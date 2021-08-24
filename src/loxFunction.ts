import { Callable } from './callable'
import { Environment } from './environment'
import { FunctionStmt } from './generated/Stmt'
import { executeBlock, InterpreterContext, Return } from './interpret'

export class LoxFunction implements Callable {
	public constructor(
        private readonly declaration: FunctionStmt,
        private readonly closure: Environment
    ) {}

	public call(ctx: InterpreterContext, args: (Object | null)[]): Object | null {
		const environment = new Environment(this.closure)
		this.declaration.params.forEach((p, index) =>
			environment.define(p, args[index])
		)
        const prevEnvironment = ctx.environment
        ctx.environment = environment
        try {
            executeBlock(ctx, this.declaration.body)
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
}
