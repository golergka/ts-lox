import { Callable } from "./callable";
import { Environment } from "./environment";
import { Token } from "./Token";

const clock: Callable = {
    arity: 0,
    call: () => new Date().getTime() / 1000,
}

export const createGlobal = () => {
    const global = new Environment()
    global.define("clock", clock)
    return global
}