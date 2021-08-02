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
		const typeNames = types.map((type) => type.name)
		await defineUnion(file, baseName, typeNames)
		await defineVisitor(file, baseName, typeNames)
		await defineVisitFunction(file, baseName, typeNames)
		console.log(`generated ${path}`)
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

async function defineUnion(
	file: fs.FileHandle,
	baseName: string,
	typeNames: string[]
) {
	await file.write(`export type ${baseName} =\n`)
	for (const type of typeNames) {
		await file.write(`    | ${type}\n`)
	}
	await file.write('\n')
}

async function defineVisitor(
	file: fs.FileHandle,
	baseName: string,
	typeNames: string[]
) {
	await file.write(`export interface ${baseName}Visitor<T> {\n`)
	for (const type of typeNames) {
		await file.write(`    visit${type}(node: ${type}): T\n`)
	}
	await file.write('}\n')
	await file.write('\n')
}

async function defineVisitFunction(
	file: fs.FileHandle,
	baseName: string,
	typeNames: string[]
) {
	await file.write(`export function visit${baseName}<T>(
		visitor: ${baseName}Visitor<T>,
		node: ${baseName}
	): T {\n`)
	await file.write(`    switch(node.type) {\n`)
	for (const type of typeNames) {
		await file.write(`        case '${type.toLowerCase()}': return visitor.visit${type}(node)\n`)
	}
	await file.write('    }\n')
	await file.write('}\n')
	await file.write('\n')
}