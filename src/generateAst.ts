import * as fs from 'fs/promises'
import { join } from 'path'

const [_node, _exec, outputDir, ...restArgs] = process.argv

if (restArgs.length > 0 || !outputDir) {
	console.log('Usage: generate_ast <output directory>')
	process.exit(1)
}

defineAst(outputDir, 'Expr', [
	'Binary   : Expr left, Token operator, Expr right',
	'Grouping : Expr expression',
	'Literal  : Object value',
	'Unary    : Token operator, Expr right'
])

async function defineAst(
	outputDir: string,
	baseName: string,
	typeLines: string[]
) {
	const types = typeLines.map((line) => {
		const [rawClassname, rawFieldList] = line.split(':')
		const name = rawClassname.trim()
		const fields: [type: string, name: string][] = rawFieldList
			.trim()
			.split(', ')
			.map((rawField) => {
				const [type, name] = rawField.split(' ')
				return [type, name]
			})
		return { name, fields }
	})
	const path = join(process.cwd(), outputDir + '/' + baseName + '.ts')
	const file = await fs.open(path, 'w')
	try {
		await file.write(`import { Token } from '../Token'\n`)
		await file.write('\n')
		for (const { name, fields } of types) {
			await defineType(file, name, fields)
		}
		await file.write(`export type ${baseName} =\n`)
		for (const typeName of types.map((t) => t.name)) {
			await file.write(`    | ${typeName}\n`)
		}
	} finally {
		await file.close()
	}
}

async function defineType(
	file: fs.FileHandle,
	typeName: string,
	fields: [type: string, name: string][]
) {
	await file.write(`export interface ${typeName} {\n`)
	await file.write(`    type: '${typeName.toLowerCase()}'\n`)
	for (const [type, name] of fields) {
		await file.write(`    ${name}: ${type}\n`)
	}
	await file.write(`}\n`)
	await file.write('\n')
}
