import * as fs from 'fs'
import * as readline from 'readline'
import { Scanner } from './Scanner'

let hadError = false

export function runFile(filename: string) {
	const code = fs.readFileSync(filename, "utf8")
	run(code, filename)
	if (hadError) process.exit(1)
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
	}
}

function run(source: string, filename?: string) {
	const scanner = new Scanner(source)
	const tokens = scanner.scanTokens()
	
	for (const token of tokens) {
		console.log(token)
	}
}

export function report(line: number, message: string): void
export function report(line: number, where: string, message: string): void
export function report(line: number, arg1: string, arg2?: string) {
	const where = arg2 ? arg1 : ''
	const message = arg2 || arg1
	console.log(`[line ${line}] Error${where}: ${message}`)
	hadError = true
}