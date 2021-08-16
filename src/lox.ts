import * as fs from 'fs'
import * as readline from 'readline'
import { interpret, InterpreterContext, RuntimeError } from './interpret'
import { ParserContext, parseTokens } from './parseTokens'
import { scan } from './scan'
import { Token } from './Token'


class Context implements ParserContext, InterpreterContext {

	private _hadError = false
	private _hadRuntimeError = false
	
	public get hadError() {
		return this._hadError
	}
	
	public get hadRuntimeError() {
		return this._hadRuntimeError
	}

	parserError(line: number, message: string): void
	parserError(line: number, where: string, message: string): void
	parserError(line: number, arg1: string, arg2?: string) {
		const where = arg2 ? arg1 : ''
		const message = arg2 || arg1
		console.log(`[line ${line}] Error${where}: ${message}`)
		this._hadError = true
	}

	runtimeError(error: RuntimeError) {
		console.log(error.message + `\n[line ${error.token.line}]`)
		this._hadRuntimeError = true
	}
}

export function runFile(filename: string) {
	const ctx = new Context()
	const code = fs.readFileSync(filename, "utf8")
	run(ctx, code, filename)
	if (ctx.hadError) process.exit(65)
	if (ctx.hadRuntimeError) process.exit(70)
}

export async function runPrompt() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	async function question(query: string): Promise<string> {
		return new Promise((resolve) => {
			rl.question(query, resolve)	
		})
	}

	while (true) {
		const line = await question("> ")
		if (line === null) break;
		const ctx = new Context()
		run(ctx, line)
	}
}

function run(ctx: Context, source: string, filename?: string) {
	const tokens = scan(ctx, source)
	const expression = parseTokens(ctx, tokens)
	
	if (!expression || ctx.hadError) return
	
	interpret(ctx, expression)
}