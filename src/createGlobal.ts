import { Callable } from "./callable";
import { Environment } from "./environment";
import { Token } from "./Token";

const clock: Callable = {
    arity: 0,
    call: () => new Date().getTime() / 1000,
}

export const createGlobal = () => {
    const global = new Environment()
    global.define(new Token("IDENTIFIER", "clock", "clock", 1), clock)
    return global
}