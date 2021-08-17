import { InterpreterContext } from './interpret'

export interface Callable {
    call(ctx: InterpreterContext, args: Object|null[]): Object|null;
}