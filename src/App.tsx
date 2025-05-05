import { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import Editor, { Monaco, OnMount } from "@monaco-editor/react";
import CodeSelector from './components/CodeSelector';
import StatsDisplay from './components/StatsDisplay';
import { preact } from './snippet/js';

// --- Interfaces ---
interface CodeSnippet {
  id: string;
  name: string;
  language: string;
  code: string;
}

// --- Sample Data ---
const initialSnippets: CodeSnippet[] = [
  { id: 'js1', name: 'Preact (JS)', language: 'javascript', code: preact },
  { id: 'py1', name: 'Python: Simple Function', language: 'python', code: "def greet(name):\n  print(f'Hello, {name}!')" },
  { id: 'ts1', name: 'TypeScript: Interface', language: 'typescript', code: "interface User {\n  name: string;\n  id: number;\n}" },
];

// --- Monaco Decoration Classes ---
const DECORATION_CLASS_CORRECT = 'typing-correct';
const DECORATION_CLASS_INCORRECT = 'typing-incorrect';
const DECORATION_CLASS_UNTYPED = 'typing-untyped';

function App() {
  // --- State Variables ---
  const [snippets, setSnippets] = useState<CodeSnippet[]>(initialSnippets);
  const [selectedSnippetId, setSelectedSnippetId] = useState<string>(snippets[0]?.id || '');
  const [currentCode, setCurrentCode] = useState<string>(snippets[0]?.code || '');
  const [currentLanguage, setCurrentLanguage] = useState<string>(snippets[0]?.language || 'javascript');
  const [userInput, setUserInput] = useState<string>(''); // Reintroduce userInput state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const timerIntervalRef = useRef<number | null>(null);
  const editorRef = useRef<any | null>(null); // Keep as any for now
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const appContainerRef = useRef<HTMLDivElement>(null); // Ref for the main container to attach listener

  // --- Effects ---

  // Reset state when snippet changes
  useEffect(() => {
    const selected = snippets.find(s => s.id === selectedSnippetId);
    if (selected) {
      setCurrentCode(selected.code);
      setCurrentLanguage(selected.language);
      setUserInput(''); // Reset user input
      setStartTime(null);
      setElapsedTime(0);
      setWpm(0);
      setAccuracy(100);
      setIsTyping(false);
      setIsFinished(false);
      // Explicitly use window.clearInterval here too for consistency
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
      if (editorRef.current) {
        editorRef.current.setValue(selected.code); // Update editor display
        applyDecorations(selected.code, ''); // Reset decorations
        editorRef.current.setPosition({ lineNumber: 1, column: 1 }); // Reset cursor
        editorRef.current.revealPosition({ lineNumber: 1, column: 1 });
        // Ensure editor is focused to receive keyboard events if listener is on editor
         setTimeout(() => editorRef.current?.focus(), 0); // Focus after state update
      }
    }
  }, [selectedSnippetId, snippets]);

  // Timer effect
  useEffect(() => {
    if (isTyping && !isFinished) {
      // Explicitly use window.setInterval to ensure it returns a number
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime(prevTime => {
          const now = Date.now();
          const newElapsedTime = (now - (startTime ?? now)) / 1000;
          const wordsTyped = userInput.length / 5; // Use userInput for WPM
          const minutesElapsed = newElapsedTime / 60;
          setWpm(minutesElapsed > 0 ? Math.round(wordsTyped / minutesElapsed) : 0);
          return newElapsedTime;
        });
      }, 100);
    } else if (timerIntervalRef.current) {
      // Explicitly use window.clearInterval
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    // Cleanup function
    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTyping, isFinished, startTime, userInput]); // Add userInput dependency

  // --- Monaco Editor Logic ---

  // Apply decorations based on userInput vs currentCode
  const applyDecorations = useCallback((code: string, input: string) => {
    if (!editorRef.current || !monacoRef.current) return;

    const newDecorations: any[] = []; // Use any temporarily
    let correctChars = 0;
    const codeLen = code.length;
    const inputLen = input.length;

    for (let i = 0; i < codeLen; i++) {
      const charIndex = i + 1;
      // Monaco position is { lineNumber, column }
      // Assuming single line for simplicity, adjust if multi-line needed
      const model = editorRef.current.getModel();
      if (!model) continue; // Ensure model exists
      const position = model.getPositionAt(i); // Helper to get line/column from offset
      // No need to check !position, getPositionAt should always return a position for valid offset

      const range = new monacoRef.current.Range(position.lineNumber, position.column, position.lineNumber, position.column + 1);
      let className = DECORATION_CLASS_UNTYPED;

      if (i < inputLen) {
        if (input[i] === code[i]) {
          className = DECORATION_CLASS_CORRECT;
          correctChars++;
        } else {
          className = DECORATION_CLASS_INCORRECT;
        }
      }
      newDecorations.push({
        range: range,
        options: { inlineClassName: className, stickiness: monacoRef.current?.editor?.TrackedRangeStickiness?.NeverGrowsWhenTypingAtEdges ?? 1 }
      });
    }

    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, newDecorations);
    setAccuracy(inputLen > 0 ? (correctChars / inputLen) * 100 : 100);

    // Update cursor position
    const cursorOffset = inputLen;
    const model = editorRef.current.getModel();
    if (!model) return; // Ensure model exists
    const cursorPosition = model.getPositionAt(cursorOffset);
     // No need to check !cursorPosition, getPositionAt should always return a position
     if (editorRef.current && monacoRef.current) { // Ensure refs are valid
       editorRef.current.setPosition(cursorPosition);
       editorRef.current.revealPosition(cursorPosition, monacoRef.current.editor.ScrollType.Smooth);
     }

  }, []); // Empty dependency array initially, refs don't need to be deps

  // --- Event Handlers ---
  const handleStartTyping = useCallback(() => { // Wrap in useCallback
    if (!isTyping && !isFinished) {
      setStartTime(Date.now());
      setIsTyping(true);
      setElapsedTime(0);
      setWpm(0);
      setAccuracy(100);
    }
  }, [isTyping, isFinished]); // Add dependencies

  // Keyboard event handler - Moved handleStartTyping definition above
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isFinished || !editorRef.current) return; // Ignore input if finished or editor not ready

    const { key } = event;

    // Start timer on first valid key press
    if (!isTyping && key.length === 1) { // Check for printable characters
        handleStartTyping();
    }

    let newUserInput = userInput;

    if (key === 'Backspace') {
      event.preventDefault(); // Prevent default backspace behavior in browser
      newUserInput = userInput.slice(0, -1);
    } else if (key === 'Enter') {
        event.preventDefault();
        // Check if the expected character is a newline
        if (userInput.length < currentCode.length && currentCode[userInput.length] === '\n') {
            newUserInput = userInput + '\n'; // Add newline to input
        } else {
            // Incorrect key press if Enter wasn't expected
            // Optionally handle incorrect Enter press feedback here
            return; // Do nothing if Enter is not the correct next char
        }
    } else if (key.length === 1) { // Handle other printable characters
        event.preventDefault();
        if (userInput.length < currentCode.length) {
             newUserInput = userInput + key;
        } else {
            return; // Do nothing if at the end
        }

    } else {
        // Ignore other keys like Shift, Ctrl, Alt, Arrows, etc.
        return;
    }

    setUserInput(newUserInput);
    applyDecorations(currentCode, newUserInput); // Update decorations immediately

    // Check if finished after state update (use newUserInput for immediate check)
    if (newUserInput.length === currentCode.length && currentCode.length > 0) {
      setIsFinished(true);
      setIsTyping(false);
      // Final WPM calculation
      const finalElapsedTime = (Date.now() - (startTime ?? Date.now())) / 1000;
      const wordsTyped = currentCode.length / 5;
      const minutesElapsed = finalElapsedTime / 60;
      setWpm(minutesElapsed > 0 ? Math.round(wordsTyped / minutesElapsed) : 0);
      setElapsedTime(finalElapsedTime);
    } else {
        // If user deletes after finishing, reset finished state
         if (isFinished && key === 'Backspace') {
             setIsFinished(false);
             // Optionally restart timer here if desired
         }
    }

  }, [userInput, isTyping, isFinished, currentCode, startTime, applyDecorations, handleStartTyping]); // Added handleStartTyping dependency

  // Attach/detach keyboard listener
  useEffect(() => {
    const container = appContainerRef.current;
    if (container) {
        // Use capture phase to potentially intercept events before Monaco does (though editor is read-only)
        container.addEventListener('keydown', handleKeyDown, true);
        // Ensure container can receive focus
        container.setAttribute('tabindex', '-1');
         // Focus container on mount/snippet change to capture keys
         // container.focus(); // Or focus editor below
    }
    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown, true);
      }
    };
  }, [handleKeyDown]); // Re-attach if handler changes


  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('typing-theme-dark', { base: 'vs-dark', inherit: true, rules: [], colors: { 'editor.background': '#1e1e1e', 'editor.foreground': '#d4d4d4' } });
    monaco.editor.defineTheme('typing-theme-light', { base: 'vs', inherit: true, rules: [], colors: { 'editor.background': '#ffffff', 'editor.foreground': '#333333' } });

    applyDecorations(currentCode, ''); // Apply initial untyped decorations

    // Remove the model change listener as we use keyboard events now
    // editor.getModel()?.onDidChangeContent(handleEditorModelChange);

    // Focus the editor initially to ensure cursor is visible and potentially helps with initial key capture
    editor.focus();
  };

  // handleStartTyping is already defined above using useCallback

  const handleSnippetChange = (id: string) => {
    setSelectedSnippetId(id);
    // useEffect handles the reset
  };

  // --- Editor Options ---
  const editorOptions: any = { // Use any temporarily
    readOnly: true, // Make editor read-only
    domReadOnly: true,
    fontSize: 16, lineNumbers: 'off', glyphMargin: false,
    folding: false, lineDecorationsWidth: 0, lineNumbersMinChars: 0, minimap: { enabled: false },
    scrollbar: { vertical: 'auto', horizontal: 'auto', useShadows: false },
    overviewRulerLanes: 0, hideCursorInOverviewRuler: true, scrollBeyondLastLine: false,
    wordWrap: 'on', wrappingIndent: 'indent', renderLineHighlight: 'none', cursorStyle: 'line',
    cursorBlinking: 'smooth', occurrencesHighlight: 'off', selectionHighlight: false,
    renderIndentGuides: false, matchBrackets: 'never', padding: { top: 15, bottom: 15 },
    quickSuggestions: false, snippetSuggestions: 'none', suggestOnTriggerCharacters: false,
    wordBasedSuggestions: false,
    // Ensure cursor is always visible even if readOnly
    // (May not be needed depending on Monaco version/behavior)
    // revealCursor: 'near',
  };


  // Calculate total words (simple split by whitespace)
  const totalWords = currentCode.split(/\s+/).filter(Boolean).length;

  return (
    // Add ref and tabindex, remove max-width, adjust padding/margin for full width
    <div ref={appContainerRef} tabIndex={-1} className="min-h-screen p-4 sm:p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none">
      {/* Center content within the full-width container */}
      <div className="max-w-5xl mx-auto"> {/* Optional: Reintroduce a max-width for content if needed, or remove */}
          <h1 className="text-center text-3xl font-bold mt-0 mb-8 text-gray-800 dark:text-gray-200">Typing Practice Master</h1>

      <CodeSelector
        snippets={snippets.map(s => ({ id: s.id, name: s.name }))}
        selectedId={selectedSnippetId}
        onSelect={handleSnippetChange}
        disabled={isTyping && !isFinished}
      />

      <div className="mt-6 mb-6 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden shadow-inner">
        <Editor
          height="300px"
          language={currentLanguage}
          value={currentCode} // Editor always shows the full code
          theme={window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? "typing-theme-dark" : "typing-theme-light"}
          options={editorOptions}
          onMount={handleEditorDidMount}
          // No onChange needed here
        />
      </div>

      <StatsDisplay
        wpm={wpm}
        accuracy={accuracy}
        timeElapsed={elapsedTime}
        totalWords={totalWords} // Pass total words
      />

      {isFinished && (
        <button
          onClick={() => handleSnippetChange(selectedSnippetId)}
          className="block mx-auto mt-8 py-2 px-6 text-lg font-medium cursor-pointer rounded-md border border-transparent bg-blue-600 text-white transition duration-200 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Restart
        </button>
      )}
      </div> {/* Close inner centering div */}
    </div>
  );
}

export default App;
