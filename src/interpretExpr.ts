import { Expr } from "./generated/Expr";

export function intepretExpr(expr: Expr): Object|null {
    switch (expr.type) {
        case 'literal':
            return expr.value
        case 'grouping':
            return intepretExpr(expr)
        case 'unary': {
            const right = intepretExpr(expr.right)
            
            switch (expr.operator.type) {
                case 'MINUS':
                    return -right!
                case 'BANG':
                    return !isTruthy(right)
            }
            
            throw new Error('TODO')
        }
    }
}