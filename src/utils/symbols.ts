import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

export interface CodeSymbol {
  name: string
  kind: string
  line: number
  depth: number
}

// Subset of the TypeScript navigation tree returned by Monaco's TS worker
interface NavigationTree {
  text: string
  kind: string
  spans: { start: number; length: number }[]
  nameSpan?: { start: number; length: number }
  childItems?: NavigationTree[]
}

// Variables are only listed at the top level; locals inside functions are just noise
const TS_VARIABLE_KINDS = new Set(['const', 'let', 'var'])

const TS_SYMBOL_KINDS = new Set([
  'function',
  'class',
  'method',
  'constructor',
  'getter',
  'setter',
  'interface',
  'type',
  'enum',
  'const',
  'let',
  'var',
])

async function getTsSymbols(
  monaco: Monaco,
  model: editor.ITextModel,
  isTypeScript: boolean,
): Promise<CodeSymbol[]> {
  const getWorker = isTypeScript
    ? await monaco.languages.typescript.getTypeScriptWorker()
    : await monaco.languages.typescript.getJavaScriptWorker()
  const worker = await getWorker(model.uri)
  const tree: NavigationTree | undefined = await worker.getNavigationTree(model.uri.toString())
  if (!tree || model.isDisposed()) return []

  const symbols: CodeSymbol[] = []
  const walk = (items: NavigationTree[] | undefined, depth: number) => {
    for (const item of items ?? []) {
      // Skip anonymous items such as "<function>" or "<class>"
      if (!TS_SYMBOL_KINDS.has(item.kind) || item.text.startsWith('<')) continue
      if (depth > 0 && TS_VARIABLE_KINDS.has(item.kind)) continue
      const offset = item.nameSpan?.start ?? item.spans[0]?.start ?? 0
      symbols.push({
        name: item.text,
        kind: item.kind,
        line: model.getPositionAt(offset).lineNumber,
        depth,
      })
      walk(item.childItems, depth + 1)
    }
  }
  walk(tree.childItems, 0)

  return symbols.sort((a, b) => a.line - b.line)
}

// Regex fallback for languages without a symbol provider in Monaco
function getPythonSymbols(code: string): CodeSymbol[] {
  const symbols: CodeSymbol[] = []
  code.split('\n').forEach((text, index) => {
    const match = /^(\s*)(def|class)\s+(\w+)/.exec(text)
    if (match) {
      symbols.push({
        name: match[3],
        kind: match[2] === 'def' ? 'function' : 'class',
        line: index + 1,
        depth: match[1].length > 0 ? 1 : 0,
      })
    }
  })
  return symbols
}

export async function getSymbols(
  monaco: Monaco,
  model: editor.ITextModel,
  language: string,
): Promise<CodeSymbol[]> {
  if (language === 'javascript' || language === 'typescript') {
    return getTsSymbols(monaco, model, language === 'typescript')
  }
  if (language === 'python') {
    return getPythonSymbols(model.getValue())
  }
  return []
}
