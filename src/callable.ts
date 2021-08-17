import { InterpreterContext } from './interpret'

export interface Callable {
	call(ctx: InterpreterContext, args: Object | null[]): Object | null
}

export function isCallable(x: any): x is Callable {
	return x && typeof x.call === 'function'
}