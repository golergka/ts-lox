import { Expr, LambdaExpr } from './generated/Expr'
import { FunctionStmt, Stmt } from './generated/Stmt'
import { parseError } from './parseError'
import { ParserContext } from './parseTokens'
import { Token } from './Token'

export function resolve(ctx: ParserContext, stmts: Stmt[]) {
	const scopes: Map<string, boolean>[] = []

	function peekScope() {
		return scopes[scopes.length - 1]
	}

	function beginScope() {
		scopes.push(new Map())
	}

	function endScope() {
		scopes.pop()
	}

	function declare(name: Token) {
		if (scopes.length === 0) return

		const scope = peekScope()
		scope.set(name.lexeme, false)
	}

	function define(name: Token) {
		if (scopes.length === 0) return

		peekScope().set(name.lexeme, true)
	}

	const error = parseError(ctx)
    
    function resolveLocal(expr: Expr, name: Token) {
        for (let i = scopes.length - 1; i >= 0; i--) {
            if (scopes[i].has(name.lexeme)) {
                resolveTodo(expr, scopes.length - 1 - i)
            }
        }
    }
    
    function resolveLambda(lambda: LambdaExpr) {
        beginScope()
        for (const param of lambda.params) {
            declare(param)
            define(param)
        }
        resolveStmts(lambda.body)
        endScope()
    }

	function resolveExpr(expr: Expr): true {
		switch (expr.type) {
			case 'variable': {
				if (
					scopes.length !== 0 &&
					peekScope().get(expr.name.lexeme) === false
				) {
					error(
						expr.name,
						`Can't read local variable ${expr.name.lexeme} in it's own initializer.`
					)
				}
                
                resolveLocal(expr, expr.name)
                return true
			}
            case 'assignment': {
                resolveExpr(expr.value)
                resolveLocal(expr, expr.name)
                return true
            }
            case 'binary': {
                resolveExpr(expr.left)
                resolveExpr(expr.right)
                return true
            }
            case 'binaryError': {
                resolveExpr(expr.right)
                return true
            }
            case 'conditional': {
                resolveExpr(expr.condition)
                resolveExpr(expr.consequent)
                resolveExpr(expr.alternative)
                return true
            }
            case 'lambda': {
                resolveLambda(expr)
                return true
            }
            case 'call': {
                resolveExpr(expr.callee)
                for (const arg of expr.args) {
                    resolveExpr(arg)
                }
                return true
            }
            case 'grouping': {
                resolveExpr(expr.expression)
                return true
            }
            case 'literal': return true
            case 'unary': {
                resolveExpr(expr.right)
                return true
            }
		}
	}

	function resolveStmt(stmt: Stmt): true {
		switch (stmt.type) {
			case 'block': {
				beginScope()
				resolveStmts(stmt.statements)
				endScope()
				return true
			}
			case 'var': {
				declare(stmt.name)
				if (stmt.initializer != null) {
					resolveExpr(stmt.initializer)
				}
				define(stmt.name)
				return true
			}
            case 'function': {
                declare(stmt.name)
                define(stmt.name)
                resolveLambda(stmt.lambda)
                return true
            }
            case 'expression': {
                resolveExpr(stmt.expression)
                return true
            }
            case 'if': {
                resolveExpr(stmt.condition)
                resolveStmt(stmt.consequent)
                if (stmt.alternative) {
                    resolveStmt(stmt.alternative)
                }
                return true
            }
            case 'print': {
                resolveExpr(stmt.expression)
                return true
            }
            case 'return': {
                if (stmt.value != null) {
                    resolveExpr(stmt.value)
                }
                return true
            }
            case 'while': {
                resolveExpr(stmt.condition)
                resolveStmt(stmt.body)
                return true
            }
            case 'continue':
            case 'break':
            case 'continueError':
            case 'breakError':
                return true
		}
	}

	function resolveStmts(stmts: Stmt[]): void {
		for (const stmt of stmts) {
			resolveStmt(stmt)
		}
	}

	return resolveStmts(stmts)
}
