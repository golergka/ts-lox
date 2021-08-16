import * as fs from 'fs'
import * as readline from 'readline'
import { interpret, RuntimeError } from './interpret'
import { parseTokens } from './parseTokens'
import { printExpr } from './printExpr'
import { scan } from './scan'
import { Token } from './Token'

let hadError = false
let hadRuntimeError = false

export function runFile(filename: string) {
	const code = fs.readFileSync(filename, "utf8")
	run(code, filename)
	if (hadError) process.exit(65)
	if (hadRuntimeError) process.exit(70)
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
		run(line)
		hadError = false
		hadRuntimeError = false
	}
}

function run(source: string, filename?: string) {
	const tokens = scan(source)
	const expression = parseTokens(tokens)
	
	if (!expression || hadError) return
	
	interpret(expression)
}

export function report(line: number, message: string): void
export function report(line: number, where: string, message: string): void
export function report(line: number, arg1: string, arg2?: string) {
	const where = arg2 ? arg1 : ''
	const message = arg2 || arg1
	console.log(`[line ${line}] Error${where}: ${message}`)
	hadError = true
}

export function loxError(token: Token, message: string) {
	if (token.type === 'EOF') {
		report(token.line, " at end", message)
	} else {
		report(token.line, ` at '${token.lexeme}'`, message)
	}
}

export function runtimeError(error: RuntimeError) {
	console.log(error.message + `\n[line ${error.token.line}]`)
	hadRuntimeError = true
}