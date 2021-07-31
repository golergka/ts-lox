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

async function defineAst(outputDir: string, baseName: string, types: string[]) {
	const path = join(process.cwd(), outputDir + '/' + baseName + '.ts')
	const file = await fs.open(path, 'w')
	try {
        await file.write(`import { Token } from '../Token'\n`)
        await file.write('\n')
		for (const type of types) {
			const [rawClassname, rawFieldList] = type.split(':')
			const typeName = rawClassname.trim()
			const fields = rawFieldList.trim().split(', ')
			await defineType(file, baseName, typeName, fields)
		}
		await file.write(`export interface ${baseName} {\n`)
		await file.write('}\n')
	} finally {
		await file.close()
	}
}

async function defineType(
	file: fs.FileHandle,
	baseName: string,
	typeName: string,
	fields: string[]
) {
	await file.write(`export interface ${typeName} {\n`)
	for (const field of fields) {
		const [type, name] = field.split(' ')
		await file.write(`    ${name}: ${type}\n`)
	}
	await file.write(`}\n`)
    await file.write('\n')
}
