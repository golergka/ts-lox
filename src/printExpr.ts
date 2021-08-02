import {
	BinaryExpr,
	Expr,
	ExprVisitor,
	GroupingExpr,
	LiteralExpr,
	UnaryExpr,
	visitExpr
} from './generated/Expr'

const astPrinter: ExprVisitor<string> = {
	visitBinary: (node: BinaryExpr) =>
		parenthesize(node.operator.lexeme, node.left, node.right),
	visitGrouping: (node: GroupingExpr) => parenthesize('group', node.expression),
	visitLiteral: (node: LiteralExpr) =>
		node.value === null ? 'nil' : node.value.toString(),
	visitUnary: (node: UnaryExpr) =>
		parenthesize(node.operator.lexeme, node.right)
}

export const printExpr = visitExpr(astPrinter)

function parenthesize(name: string, ...expressions: Expr[]): string {
	return `(${name}${expressions.map((e) => ` ${printExpr(e)}`).join()})`
}
