import * as fs from 'fs/promises'
import { join } from 'path'

const [_node, _exec, outputDir, ...restArgs] = process.argv

if (restArgs.length > 0 || !outputDir) {
	console.log('Usage: generate_ast <output directory>')
	process.exit(1)
}

defineAst(
	outputDir,
	'Expr',
	[
		'Conditional : Expr condition, Expr consequent, Expr alternative',
		'Assignment  : Token name, Expr value',
		'Binary      : Expr left, Token operator, Expr right',
		'BinaryError : Token operator, Expr right',
		'Call        : Expr callee, Token paren, Expr[] args',
		'Get         : Expr object, Token name',
		'Grouping    : Expr expression',
		'Literal     : Object|null value',
		'Set         : Expr object, Token name, Expr value',
		'This        : Token keyword',
		'Unary       : Token operator, Expr right',
		'Variable    : Token name',
		'Lambda      : Token[] params, Stmt[] body'
	],
	[
		[['Token'], '../Token'],
		[['Stmt'], './Stmt'],
	]
)

defineAst(
	outputDir,
	'Stmt',
	[
		'Block 		: Stmt[] statements',
		'Class      : Token name, FunctionStmt[] methods',
		'Expression : Expr expression',
		'Function   : Token name, LambdaExpr lambda',
		'If         : Expr condition, Stmt consequent, Stmt|null alternative',
		'Print      : Expr expression',
		'Return     : Token keyword, Expr|null value',
		'Var        : Token name, Expr|null|undefined initializer',
		'While      : Expr condition, Stmt body',
		'Break      : Token body',
		'Continue   : Token body',
		'BreakError : Token body',
		'ContinueError : Token body'
	],
	[
		[['Expr', 'LambdaExpr'], './Expr'],
		[['Token'], '../Token']
	]
)

async function defineAst(
	outputDir: string,
	baseName: string,
	typeLines: string[],
	imports: [types: string[], from: string][] = []
) {
	const types = typeLines.map((line) => {
		const [rawClassname, rawFieldList] = line.split(':')
		const name = rawClassname.trim()
		const tag = name.slice(0, 1).toLowerCase() + name.slice(1)
		const fields: [type: string, name: string][] = rawFieldList
			.trim()
			.split(', ')
			.map(rawField => rawField.trim())
			.filter(rawField => rawField.length > 0)
			.map((rawField) => {
				const [type, name] = rawField.split(' ')
				return [type, name]
			})
		return { name, tag, fields }
	})
	const path = join(process.cwd(), outputDir + '/' + baseName + '.ts')
	const file = await fs.open(path, 'w')
	try {
		for (const [types, from] of imports) {
			await file.write(`import { ${types.join(', ')} } from '${from}'\n`)
		}
		await file.write('\n')
		for (const type of types) {
			await defineType(file, baseName, type)
		}
		await defineUnion(file, baseName, types)
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
	await file.write(`export function ${tag}${baseName}(\n`)
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
