import { Token } from '../Token'

export interface BinaryExpr {
    type: 'binary'
    left: Expr
    operator: Token
    right: Expr
}

export function binaryExpr(
    left: Expr,
    operator: Token,
    right: Expr,
): BinaryExpr {
    return {
        type: 'binary',
        left,
        operator,
        right,
    }
}

export interface GroupingExpr {
    type: 'grouping'
    expression: Expr
}

export function groupingExpr(
    expression: Expr,
): GroupingExpr {
    return {
        type: 'grouping',
        expression,
    }
}

export interface LiteralExpr {
    type: 'literal'
    value: Object
}

export function literalExpr(
    value: Object,
): LiteralExpr {
    return {
        type: 'literal',
        value,
    }
}

export interface UnaryExpr {
    type: 'unary'
    operator: Token
    right: Expr
}

export function unaryExpr(
    operator: Token,
    right: Expr,
): UnaryExpr {
    return {
        type: 'unary',
        operator,
        right,
    }
}

export type Expr =
    | BinaryExpr
    | GroupingExpr
    | LiteralExpr
    | UnaryExpr

export interface ExprVisitor<T> {
    visitBinary(node: BinaryExpr): T
    visitGrouping(node: GroupingExpr): T
    visitLiteral(node: LiteralExpr): T
    visitUnary(node: UnaryExpr): T
}

export const visitExpr = <T>(
		visitor: ExprVisitor<T>
	) => (
		node: Expr
	): T => {
    switch(node.type) {
        case 'binary': return visitor.visitBinary(node)
        case 'grouping': return visitor.visitGrouping(node)
        case 'literal': return visitor.visitLiteral(node)
        case 'unary': return visitor.visitUnary(node)
    }
}

