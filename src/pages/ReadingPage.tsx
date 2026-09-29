import { useEffect, useRef, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import CodeSelector from '../components/CodeSelector'
import SymbolsPane from '../components/SymbolsPane'
import {
  snippetsAtom,
  selectedSnippetIdAtom,
  selectedSnippetAtom,
  currentCodeAtom,
  currentLanguageAtom,
} from '../store/atoms'
import { CodeSymbol, getSymbols } from '../utils/symbols'

// Read-only, GitHub-style view of the selected snippet: full-height code plus a symbols pane
function ReadingPage() {
  const [snippets] = useAtom(snippetsAtom)
  const [selectedSnippetId, setSelectedSnippetId] = useAtom(selectedSnippetIdAtom)
  const selectedSnippet = useAtomValue(selectedSnippetAtom)
  const [currentCode] = useAtom(currentCodeAtom)
  const [currentLanguage] = useAtom(currentLanguageAtom)

  const [editorHeight, setEditorHeight] = useState<number>(0)
  const [isEditorReady, setIsEditorReady] = useState<boolean>(false)
  const [symbols, setSymbols] = useState<CodeSymbol[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  // Grow the editor to fit all lines so the whole snippet is visible
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    const updateHeight = () => setEditorHeight(editor.getContentHeight())
    editor.onDidContentSizeChange(updateHeight)
    updateHeight()
    setIsEditorReady(true)
  }

  // Recompute symbols whenever the snippet changes
  useEffect(() => {
    const model = editorRef.current?.getModel()
    if (!isEditorReady || !monacoRef.current || !model) return

    let isCancelled = false
    setActiveLine(null)
    getSymbols(monacoRef.current, model, currentLanguage)
      .then((result) => {
        if (!isCancelled) setSymbols(result)
      })
      .catch(() => {
        if (!isCancelled) setSymbols([])
      })

    return () => {
      isCancelled = true
    }
  }, [isEditorReady, currentCode, currentLanguage])

  // Scroll the page to the symbol's line and select it
  const handleSelectSymbol = (symbol: CodeSymbol) => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    const model = editor?.getModel()
    const container = editorContainerRef.current
    if (!editor || !monaco || !model || !container) return

    const top =
      container.getBoundingClientRect().top +
      window.scrollY +
      editor.getTopForLineNumber(symbol.line) -
      16
    window.scrollTo({ top, behavior: 'smooth' })
    editor.setSelection(
      new monaco.Range(symbol.line, 1, symbol.line, model.getLineMaxColumn(symbol.line)),
    )
    setActiveLine(symbol.line)
  }

  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  const lineCount = currentCode ? currentCode.split('\n').length : 0

  return (
    <div className='min-h-screen p-4 sm:p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'>
      <div className='w-full'>
        <h1 className='text-center text-3xl font-bold mt-0 mb-8 text-gray-800 dark:text-gray-200'>
          Reading Mode
        </h1>
        <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
          <CodeSelector
            snippets={snippets.map((s) => ({ id: s.id, name: s.name }))}
            selectedId={selectedSnippetId}
            onSelect={setSelectedSnippetId}
          />
          <a
            href='#/'
            className='py-1.5 px-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-900 dark:text-gray-100 transition duration-200 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            Back to Typing
          </a>
        </div>
        <div className='mt-6 mb-6 flex items-start gap-4'>
          <div className='min-w-0 flex-1 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden'>
            <div className='flex items-center justify-between border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm'>
              <span className='font-semibold'>{selectedSnippet?.name}</span>
              <span className='text-gray-500 dark:text-gray-400'>
                {lineCount} lines · {currentLanguage}
              </span>
            </div>
            <div ref={editorContainerRef}>
              <Editor
                height={editorHeight}
                language={currentLanguage}
                value={currentCode}
                theme={isDark ? 'vs-dark' : 'vs'}
                onMount={handleEditorDidMount}
                options={{
                  readOnly: true,
                  automaticLayout: true,
                  // Let the page scroll instead of the editor, like GitHub's file view
                  scrollbar: { vertical: 'hidden', alwaysConsumeMouseWheel: false },
                  fontSize: 16,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  wrappingIndent: 'indent',
                  renderLineHighlight: 'none',
                  padding: { top: 15, bottom: 15 },
                }}
              />
            </div>
          </div>
          <div className='sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 lg:block'>
            <SymbolsPane symbols={symbols} activeLine={activeLine} onSelect={handleSelectSymbol} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReadingPage
