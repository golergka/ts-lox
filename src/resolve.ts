import { Expr, LambdaExpr } from './generated/Expr'
import { Stmt } from './generated/Stmt'
import { parseError } from './parseError'
import { ParserContext } from './parseTokens'
import { Token } from './Token'

type FunctionType = 'function' | 'none'

export function resolve(
	ctx: ParserContext,
	stmts: Stmt[] | Expr
): { locals: Map<Expr, number> } {
	const scopes: Map<string, {
		readonly name: Token
		defined: boolean
		used: boolean
	}>[] = []
	const locals: Map<Expr, number> = new Map()
	let currentFunction: FunctionType = 'none'

	const error = parseError(ctx)

	function peekScope() {
		return scopes[scopes.length - 1]
	}

	function beginScope() {
		scopes.push(new Map())
	}

	function endScope() {
		for (const [_, { defined, used, name }] of peekScope()) {
			if (!defined) {
				error(name, `${name.lexeme} is declared but never defined`)
			}
			if (!used) {
				error(name, `${name.lexeme} is never used`)
			}
		}
		scopes.pop()
	}

	function declare(name: Token) {
		if (scopes.length === 0) return

		const scope = peekScope()
		if (scope.has(name.lexeme)) {
			error(name, `Variable '${name.lexeme}' already declared in this scope`)
		}
		scope.set(name.lexeme, { defined: false, used: false, name })
	}

	function define(name: Token) {
		if (scopes.length === 0) return

		const variable = peekScope().get(name.lexeme)
		if (!variable) {
			error(name, `Variable ${name.lexeme} not declared in this scope`)
		} else {
			variable.defined = true
		}
	}

	function resolveLocal(expr: Expr, name: Token) {
		for (let i = scopes.length - 1; i >= 0; i--) {
			const variable = scopes[i].get(name.lexeme)
			if (variable) {
				variable.used = true
				locals.set(expr, scopes.length - 1 - i)
				return
			}
		}
	}

	function resolveLambda(lambda: LambdaExpr) {
		const enclosingFunction = currentFunction
		currentFunction = 'function'
		beginScope()
		for (const param of lambda.params) {
			declare(param)
			define(param)
		}
		resolveStmts(lambda.body)
		endScope()
		currentFunction = enclosingFunction
	}

	function resolveExpr(expr: Expr): true {
		switch (expr.type) {
			case 'variable': {
				if (
					scopes.length !== 0 &&
					peekScope().get(expr.name.lexeme)?.defined === false
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
			case 'get': {
				resolveExpr(expr.object)
				return true
			}
			case 'grouping': {
				resolveExpr(expr.expression)
				return true
			}
			case 'literal':
				return true
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
			case 'class': {
				declare(stmt.name)
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
				if (currentFunction === 'none') {
					error(stmt.keyword, 'Cannot return from top-level code.')
				}
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

	if (Object.hasOwnProperty.call(stmts, 'type')) {
		resolveExpr(stmts as Expr)
	} else {
		resolveStmts(stmts as Stmt[])
	}

	return { locals }
}
