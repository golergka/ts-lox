import { Token } from '../Token'

export interface Binary {
    type: 'binary'
    left: Expr
    operator: Token
    right: Expr
}

export interface Grouping {
    type: 'grouping'
    expression: Expr
}

export interface Literal {
    type: 'literal'
    value: Object
}

export interface Unary {
    type: 'unary'
    operator: Token
    right: Expr
}

export type Expr =
    | Binary
    | Grouping
    | Literal
    | Unary

export interface ExprVisitor<T> {
    visitBinary(node: Binary): T
    visitGrouping(node: Grouping): T
    visitLiteral(node: Literal): T
    visitUnary(node: Unary): T
}

export function visitExpr<T>(
		visitor: ExprVisitor<T>,
		node: Expr
	): T {
    switch(node.type) {
        case 'binary': return visitor.visitBinary(node)
        case 'grouping': return visitor.visitGrouping(node)
        case 'literal': return visitor.visitLiteral(node)
        case 'unary': return visitor.visitUnary(node)
    }
}

