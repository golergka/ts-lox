import * as fs from 'fs'
import * as readline from 'readline'
import { Scanner } from './Scanner'

const [_node, _exec, filename, ...restArgs] = process.argv

if (restArgs.length > 0) {
	console.log("Usage: tslox [script]")
	process.exit(1)
} else if (filename) {
	runFile(filename)
} else {
	runPrompt()
}

let hadError = false

function runFile(filename: string) {
	const code = fs.readFileSync(filename, "utf8")
	run(code, filename)
	if (hadError) process.exit(1)
}

async function runPrompt() {
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

function run(source: string) {
	const scanner = new Scanner(source)
	const tokens = scanner.scanTokens()
	
	for (const token of tokens) {
		console.log(token)
	}
}

function error(line: number, message: string) {
	report(line, "", message)
}

function report(line: number, where: string, message: string) {
	console.log(`[line ${line}] Error${where}: ${message}`)
	hadError = true
}