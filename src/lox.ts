import * as fs from 'fs'
import * as readline from 'readline'
import { createGlobal } from './createGlobal'
import { Environment } from './environment'
import { Expr } from './generated/Expr'
import { Stmt } from './generated/Stmt'
import { evaluate, interpret, InterpreterContext, RuntimeError } from './interpret'
import { ParserContext, parseTokens } from './parseTokens'
import { scan } from './scan'


class Context implements ParserContext, InterpreterContext {

	private _hadError = false
	private _hadRuntimeError = false

	public environment: Environment = createGlobal()
	
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
	
	resetErrors() {
		this._hadError = false
		this._hadRuntimeError = false
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

	const ctx = new Context()
	while (true) {
		const line = await question("> ")
		if (line === null) break;
		run(ctx, line)
		ctx.resetErrors()
	}
}

function run(ctx: Context, source: string, filename?: string) {
	const tokens = scan(ctx, source)
	const stmts = parseTokens(ctx, tokens, !filename)
	
	if (!stmts || ctx.hadError) return
		
	if (Object.hasOwnProperty.call(stmts, "type")) {
		const value = evaluate(ctx, stmts as Expr)
		console.log(value)
	} else {
		interpret(ctx, stmts as Stmt[])
	}
}