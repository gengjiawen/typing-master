import { useAtom } from 'jotai'
import Editor from '@monaco-editor/react'
import CodeSelector from '../components/CodeSelector'
import {
  snippetsAtom,
  selectedSnippetIdAtom,
  currentCodeAtom,
  currentLanguageAtom,
} from '../store/atoms'

// Read-only view of the selected snippet: syntax highlighting, line numbers, no typing
function ReadingPage() {
  const [snippets] = useAtom(snippetsAtom)
  const [selectedSnippetId, setSelectedSnippetId] = useAtom(selectedSnippetIdAtom)
  const [currentCode] = useAtom(currentCodeAtom)
  const [currentLanguage] = useAtom(currentLanguageAtom)

  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

  return (
    <div className='min-h-screen p-4 sm:p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'>
      <div className='max-w-5xl mx-auto'>
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
        <div className='mt-6 mb-6 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden shadow-inner'>
          <Editor
            height='calc(100vh - 220px)'
            language={currentLanguage}
            value={currentCode}
            theme={isDark ? 'vs-dark' : 'vs'}
            options={{
              readOnly: true,
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
    </div>
  )
}

export default ReadingPage
