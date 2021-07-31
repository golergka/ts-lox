import { runFile, runPrompt } from "./lox"

const [_node, _exec, filename, ...restArgs] = process.argv

if (restArgs.length > 0) {
	console.log("Usage: tslox [script]")
	process.exit(1)
} else if (filename) {
	runFile(filename)
} else {
	console.log('REPL mode')
	runPrompt()
}