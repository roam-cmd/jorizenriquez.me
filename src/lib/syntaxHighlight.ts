export type TokenType =
  | 'comment'
  | 'keyword'
  | 'string'
  | 'tag'
  | 'prop'
  | 'type'
  | 'punctuation'
  | 'plain'

export interface CodeToken {
  type: TokenType
  value: string
}

const KEYWORDS = new Set([
  'import',
  'from',
  'export',
  'default',
  'function',
  'const',
  'let',
  'return',
  'interface',
  'type',
  'true',
  'false',
  'null',
  'undefined',
  'as',
  'def',
  'class',
  'for',
  'in',
  'self',
  'VAR',
  'RETURN',
  'CALCULATE',
  'COUNTROWS',
  'DIVIDE',
  'public',
  'void',
])

const TOKEN_PATTERN =
  /(\/\/.*$|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|#.*$|--\s.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|<\/?[A-Za-z][A-Za-z0-9.-]*|\b\d+(?:\.\d+)?\b|\b[A-Z][A-Za-z0-9_]*\b|\b[a-z_][A-Za-z0-9_-]*(?==)|\b[A-Za-z_][A-Za-z0-9_]*\b|[{}()[\].,:;=<>/&|?!+-]+|\s+)/g

/**
 * Tokenizes TSX / TypeScript / Tailwind source lines into themed syntax tokens
 * without external dependencies.
 */
export function tokenizeCodeLines(source: string): CodeToken[][] {
  return source.split('\n').map((line) => {
    if (!line) {
      return [{ type: 'plain', value: ' ' }]
    }

    const tokens: CodeToken[] = []
    let match: RegExpExecArray | null
    TOKEN_PATTERN.lastIndex = 0

    while ((match = TOKEN_PATTERN.exec(line)) !== null) {
      const value = match[0]
      tokens.push({
        type: classifyToken(value),
        value,
      })
    }

    return tokens.length > 0 ? tokens : [{ type: 'plain', value: line }]
  })
}

function classifyToken(value: string): TokenType {
  if (
    value.startsWith('//') ||
    value.startsWith('/*') ||
    value.startsWith('<!--') ||
    value.startsWith('#') ||
    value.startsWith('--')
  ) {
    return 'comment'
  }
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('`') && value.endsWith('`'))
  ) {
    return 'string'
  }
  if (value.startsWith('<')) {
    return 'tag'
  }
  if (KEYWORDS.has(value)) {
    return 'keyword'
  }
  if (/^\d+(?:\.\d+)?$/.test(value)) {
    return 'type'
  }
  if (/^[A-Z][A-Za-z0-9_]*$/.test(value)) {
    return 'type'
  }
  if (/^[a-z_][A-Za-z0-9_]*$/.test(value)) {
    return 'prop'
  }
  if (/^[{}()[\].,:;=<>/&|?!+-]+$/.test(value)) {
    return 'punctuation'
  }
  return 'plain'
}

/**
 * Maps token types to palette-harmonious colors for the code reveal.
 */
export const TOKEN_COLOR_CLASS: Record<TokenType, string> = {
  comment: 'text-[var(--syntax-comment)] italic',
  keyword: 'text-[var(--syntax-keyword)] font-medium',
  string: 'text-[var(--syntax-string)]',
  tag: 'text-[var(--syntax-tag)]',
  prop: 'text-[var(--syntax-prop)]',
  type: 'text-[var(--syntax-type)]',
  punctuation: 'text-[var(--syntax-punctuation)]',
  plain: 'text-[var(--syntax-plain)]',
}

/**
 * Counts the total character length across pre-tokenized lines.
 */
export function countCodeChars(lines: CodeToken[][]): number {
  let total = 0
  for (const line of lines) {
    for (const token of line) {
      total += token.value.length
    }
  }
  return total
}

/**
 * Slices pre-tokenized lines left-to-right up to `maxChars` without
 * re-running the regex tokenizer on each animation frame.
 */
export function sliceTokenizedLines(
  lines: CodeToken[][],
  maxChars: number
): CodeToken[][] {
  if (maxChars <= 0) {
    return []
  }

  let remaining = maxChars
  const result: CodeToken[][] = []

  for (const line of lines) {
    if (remaining <= 0) {
      break
    }

    const slicedLine: CodeToken[] = []
    for (const token of line) {
      if (remaining <= 0) {
        break
      }

      if (token.value.length <= remaining) {
        slicedLine.push(token)
        remaining -= token.value.length
      } else {
        slicedLine.push({
          type: token.type,
          value: token.value.slice(0, remaining),
        })
        remaining = 0
      }
    }

    result.push(slicedLine)
  }

  return result
}
