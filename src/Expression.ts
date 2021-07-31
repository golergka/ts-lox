import { Token } from "./Token";

export interface BinaryExpr {
    type: 'binary'
    readonly left: Expr
    readonly operator: Token
    readonly right: Expr
}

export type Expr =
    | BinaryExpr