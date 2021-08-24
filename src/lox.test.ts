import { anything, spy, verify, when } from "ts-mockito";
import { Context, run } from "./lox";

let ctx: Context
let spyCtx: Context

beforeEach(() => {
    ctx = new Context()
    
    spyCtx = spy(ctx)
    when(spyCtx.print(anything())).thenReturn(undefined)
})

it('makeCounter', () => {
    const source = `
        fun makeCounter() {
            var i = 0;
            fun count() {
                i = i + 1;
                print i;
            }
            return count;
        }
        
        var counter = makeCounter();
        counter(); // "1".
        counter(); // "2".
    `
    
    run(ctx, source)
    
    verify(spyCtx.print("1")).once()
    verify(spyCtx.print("2")).once()
})

it('fibonacci', () => {
    const source = `
        fun fib(n) {
            if (n <= 1) return n;
            return fib(n - 1) + fib(n - 2);
        }

        for (var i = 0; i < 10; i = i + 1) {
            print fib(i);
        }
    `
    
    run(ctx, source)

    // 0
    verify(spyCtx.print("0")).once()
    // 1, 2
    verify(spyCtx.print("1")).twice()
    // 3
    verify(spyCtx.print("2")).once()
    // 4
    verify(spyCtx.print("3")).once()
    // 5
    verify(spyCtx.print("5")).once()
    // 6
    verify(spyCtx.print("8")).once()
    // 7
    verify(spyCtx.print("13")).once()
    // 8
    verify(spyCtx.print("21")).once()
    // 9
    verify(spyCtx.print("34")).once()
})