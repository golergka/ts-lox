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
		const tag = name.toLowerCase()
		const fields: [type: string, name: string][] = rawFieldList
			.trim()
			.split(', ')
			.map((rawField) => {
				const [type, name] = rawField.split(' ')
				return [type, name]
			})
		return { name, tag, fields }
	})
	const path = join(process.cwd(), outputDir + '/' + baseName + '.ts')
	const file = await fs.open(path, 'w')
	try {
		await file.write(`import { Token } from '../Token'\n`)
		await file.write('\n')
		for (const type of types) {
			await defineType(file, baseName, type)
		}
		await defineUnion(file, baseName, types)
		await defineVisitor(file, baseName, types)
		await defineVisitFunction(file, baseName, types)
		console.log(`generated ${path}`)
	} finally {
		await file.close()
	}
}

async function defineType(
	file: fs.FileHandle,
	baseName: string,
	{
		name,
		tag,
		fields
	}: { name: string; tag: string; fields: [type: string, name: string][] }
) {
	await file.write(`export interface ${name}${baseName} {\n`)
	await file.write(`    type: '${tag}'\n`)
	for (const [type, name] of fields) {
		await file.write(`    ${name}: ${type}\n`)
	}
	await file.write(`}\n`)
	await file.write('\n')
	await file.write(`export function ${name.toLowerCase()}${baseName}(\n`)
	for (const [type, name] of fields) {
		await file.write(`    ${name}: ${type},\n`)
	}
	await file.write(`): ${name}${baseName} {\n`)
	await file.write(`    return {\n`)
	await file.write(`        type: '${tag}',\n`)
	for (const [_, name] of fields) {
		await file.write(`        ${name},\n`)
	}
	await file.write(`    }\n`)
	await file.write(`}\n`)
	await file.write('\n')
}

async function defineUnion(
	file: fs.FileHandle,
	baseName: string,
	types: { name: string }[]
) {
	await file.write(`export type ${baseName} =\n`)
	for (const { name } of types) {
		await file.write(`    | ${name}${baseName}\n`)
	}
	await file.write('\n')
}

async function defineVisitor(
	file: fs.FileHandle,
	baseName: string,
	types: { name: string }[]
) {
	await file.write(`export interface ${baseName}Visitor<T> {\n`)
	for (const { name } of types) {
		await file.write(`    visit${name}(node: ${name}${baseName}): T\n`)
	}
	await file.write('}\n')
	await file.write('\n')
}

async function defineVisitFunction(
	file: fs.FileHandle,
	baseName: string,
	types: { name: string; tag: string }[]
) {
	await file.write(`export const visit${baseName} = <T>(
		visitor: ${baseName}Visitor<T>
	) => (
		node: ${baseName}
	): T => {\n`)
	await file.write(`    switch(node.type) {\n`)
	for (const { name, tag } of types) {
		await file.write(
			`        case '${tag}': return visitor.visit${name}(node)\n`
		)
	}
	await file.write('    }\n')
	await file.write('}\n')
	await file.write('\n')
}
