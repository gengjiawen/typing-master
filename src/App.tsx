import { useEffect, useRef, useCallback, useState } from 'react'; // Keep useState for non-atom states
import { useAtom } from 'jotai';
import Editor, { Monaco, OnMount } from "@monaco-editor/react";
import CodeSelector from './components/CodeSelector';
import StatsDisplay from './components/StatsDisplay';
import {
  snippetsAtom,
  selectedSnippetIdAtom,
  currentUserInputAtom,
  currentCodeAtom,
  currentLanguageAtom,
} from './store/atoms'; // Import atoms

// --- Monaco Decoration Classes ---
// (Keep CodeSnippet interface if needed elsewhere, or move to types file)
// interface CodeSnippet {
//   id: string;
//   name: string;
//   language: string;
//   code: string;
// }
// (Remove initialSnippets and preact import - managed by atoms.ts)

const DECORATION_CLASS_CORRECT = 'typing-correct';
const DECORATION_CLASS_INCORRECT = 'typing-incorrect';
const DECORATION_CLASS_UNTYPED = 'typing-untyped';

function App() {
  // --- Jotai State ---
  const [snippets] = useAtom(snippetsAtom);
  const [selectedSnippetId, setSelectedSnippetId] = useAtom(selectedSnippetIdAtom);
  const [userInput, setUserInput] = useAtom(currentUserInputAtom);
  const [currentCode] = useAtom(currentCodeAtom);
  const [currentLanguage] = useAtom(currentLanguageAtom);

  // --- Local Component State (Not persisted or shared globally) ---
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [startInputLength, setStartInputLength] = useState<number>(0); // Track input length when timer starts

  const timerIntervalRef = useRef<number | null>(null);
  const editorRef = useRef<any | null>(null); // Keep as any for now
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const appContainerRef = useRef<HTMLDivElement>(null); // Ref for the main container to attach listener

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

    // Explicitly remove old decorations first, then add new ones
    // This can help ensure a clean state, especially after setValue might have run.
    editorRef.current.deltaDecorations(decorationsRef.current, []); // Remove old decorations
    decorationsRef.current = editorRef.current.deltaDecorations([], newDecorations); // Add new ones and store their IDs

    setAccuracy(inputLen > 0 ? (correctChars / inputLen) * 100 : 100);

    // --- Update cursor position ---
    // Standard behavior: position cursor after the last typed character.
    // The logic for handling Enter+indentation is now in handleKeyDown.
    const model = editorRef.current.getModel();
    if (!model) return; // Ensure model exists

    const cursorOffset = inputLen;
    const targetPosition = model.getPositionAt(cursorOffset);

     // Set and reveal the calculated position
     if (editorRef.current && monacoRef.current && targetPosition) { // Ensure refs and targetPosition are valid
       editorRef.current.setPosition(targetPosition);
       editorRef.current.revealPosition(targetPosition, monacoRef.current.editor.ScrollType.Smooth);
     }

  // Pass atoms/setters if needed, but current args approach is fine.
  // Refs don't need to be dependencies. `monacoRef.current` usage inside is okay.
  }, [setAccuracy]); // Add setAccuracy as it's used from useState


  // --- Effects ---

  // Effect 1: Handle snippet changes (Reset state, set editor value)
  useEffect(() => {
    // Reset timer and other local states when the snippet changes
    setStartTime(null);
    setElapsedTime(0);
    setWpm(0);
    setAccuracy(100); // Reset accuracy on snippet change
    setIsTyping(false);
    setIsFinished(false);
    setStartInputLength(0); // Reset start input length on snippet change
    if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);

    // Set the editor's content when the currentCode changes (due to snippet selection)
    if (editorRef.current && currentCode !== undefined) {
      editorRef.current.setValue(currentCode);
      // Focus the editor when snippet changes
      setTimeout(() => editorRef.current?.focus(), 0);
    }
    // This effect should primarily react to the selected snippet ID changing,
    // which in turn changes currentCode.
  }, [selectedSnippetId, currentCode]); // Depend on ID and the resulting code


  // Effect 2: Apply decorations and update cursor based on input or code changes
  useEffect(() => {
    if (editorRef.current && currentCode !== undefined && userInput !== undefined) {
      // Apply decorations based on the current code and user input
      applyDecorations(currentCode, userInput);

      // Update cursor position based on user input length
      const cursorOffset = userInput.length;
      const model = editorRef.current.getModel();
      if (model) {
        const cursorPosition = model.getPositionAt(cursorOffset);
        // Check if editor still has focus before trying to set position
        // This prevents errors if the user clicks away while typing
        if (editorRef.current.hasTextFocus()) {
            editorRef.current.setPosition(cursorPosition);
            editorRef.current.revealPosition(cursorPosition, monacoRef.current?.editor.ScrollType.Smooth);
        }
      }
    }
    // This effect reacts to the actual input changing or the code itself changing.
  }, [userInput, currentCode, applyDecorations]); // Depend on input, code, and the decoration function


  // Effect 3: Timer effect (remains the same)
  useEffect(() => {
    if (isTyping && !isFinished) {
      // Explicitly use window.setInterval to ensure it returns a number
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime(prevTime => {
          const now = Date.now();
          const newElapsedTime = (now - (startTime ?? now)) / 1000;
          // Calculate characters typed *in this session*
          const charsTypedThisSession = userInput.length - startInputLength;

          // Only calculate WPM if at least 1 character has been typed *in this session*
          // and time has actually elapsed.
          if (charsTypedThisSession > 0 && newElapsedTime > 0) {
            const wordsTypedThisSession = charsTypedThisSession / 5;
            const minutesElapsed = newElapsedTime / 60;
            const newWpm = Math.round(wordsTypedThisSession / minutesElapsed);
            setWpm(newWpm);
          } else {
            // Otherwise, display 0 WPM.
            setWpm(0);
          }

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
  }, [isTyping, isFinished, startTime, userInput]); // Keep userInput dependency (from atom)

  // (Moved applyDecorations definition higher up)

  // --- Event Handlers ---
  const handleStartTyping = useCallback(() => { // Wrap in useCallback
    if (!isTyping && !isFinished) {
      setStartTime(Date.now());
      setIsTyping(true);
      setElapsedTime(0);
      setWpm(0);
      setAccuracy(100);
      setStartInputLength(userInput.length); // Record input length when typing starts
    }
  }, [isTyping, isFinished, setStartTime, setIsTyping, setElapsedTime, setWpm, setAccuracy, setStartInputLength, userInput.length]); // Add dependencies

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
    } else if (key === 'Tab') {
        event.preventDefault(); // Prevent focus change
        // Check if the expected character is a Tab
        if (userInput.length < currentCode.length && currentCode[userInput.length] === '\t') {
            newUserInput = userInput + '\t'; // Add Tab to input
        } else {
            // Incorrect key press if Tab wasn't expected
            // Optionally handle incorrect Tab press feedback here
            return; // Do nothing if Tab is not the correct next char
        }
    } else if (key === 'Enter') {
        event.preventDefault();
        // Check if the expected character is a newline
        const currentOffset = userInput.length;
        if (currentOffset < currentCode.length && currentCode[currentOffset] === '\n') {
            let autoIndentedInput = userInput + '\n'; // Start with the newline

            // Look ahead and append leading whitespace from the next line in currentCode
            let lookaheadOffset = currentOffset + 1;
            while (lookaheadOffset < currentCode.length) {
                const charAhead = currentCode[lookaheadOffset];
                if (charAhead === ' ' || charAhead === '\t') {
                    autoIndentedInput += charAhead; // Add the whitespace
                    lookaheadOffset++;
                } else {
                    break; // Stop at the first non-whitespace character
                }
            }
            newUserInput = autoIndentedInput; // Set the final input with newline and skipped whitespace
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

    setUserInput(newUserInput); // Use Jotai atom setter
    // applyDecorations is called within the effect reacting to userInput change,
    // but calling it here provides slightly faster visual feedback.
    // Let the useEffect handle decorations and cursor positioning based on state update
    // applyDecorations(currentCode, newUserInput); // REMOVED direct call

    // Check if finished (use atom values)
    if (newUserInput.length === currentCode.length && currentCode.length > 0) {
      setIsFinished(true);
      setIsTyping(false);
      // Final WPM calculation based on characters typed *in this session*
      const finalElapsedTime = (Date.now() - (startTime ?? Date.now())) / 1000;
      const finalCharsTypedThisSession = userInput.length - startInputLength;
      if (finalCharsTypedThisSession > 0 && finalElapsedTime > 0) {
          const finalWordsTyped = finalCharsTypedThisSession / 5;
          const finalMinutesElapsed = finalElapsedTime / 60;
          setWpm(Math.round(finalWordsTyped / finalMinutesElapsed));
      } else {
          setWpm(0); // Set WPM to 0 if no chars typed or no time elapsed
      }
      setElapsedTime(finalElapsedTime);
    } else {
        // If user deletes after finishing, reset finished state
         if (isFinished && key === 'Backspace') {
             setIsFinished(false);
             // Optionally restart timer here if desired
         }
    }

  // Dependencies: atoms, local state, callbacks
  }, [
      userInput, setUserInput, // Jotai atom value and setter
      isTyping, isFinished, // Local state
      currentCode, // Jotai atom value
      startTime, // Local state
      applyDecorations, handleStartTyping, // Callbacks
      setIsFinished, setIsTyping, setWpm, setElapsedTime // Local state setters
  ]);

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

    // Apply decorations immediately on mount using the current userInput value.
    // This handles the case where the editor mounts *after* userInput is loaded.
    // Effect 2 will handle subsequent updates if userInput changes later.
    if (currentCode !== undefined && userInput !== undefined) {
        applyDecorations(currentCode, userInput);
    }

    // Remove the model change listener as we use keyboard events now
    // editor.getModel()?.onDidChangeContent(handleEditorModelChange);

    // Focus the editor initially to ensure cursor is visible and potentially helps with initial key capture
    editor.focus();
  };

  // handleStartTyping is already defined above using useCallback

  const handleSnippetChange = (id: string) => {
    setSelectedSnippetId(id); // Use Jotai atom setter
    // The useEffect reacting to selectedSnippetId handles the reset logic
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
  // Calculate total words based on currentCode from atom
  const totalWords = currentCode ? currentCode.split(/\s+/).filter(Boolean).length : 0;

  return (
    // Add ref and tabindex, remove max-width, adjust padding/margin for full width
    <div ref={appContainerRef} tabIndex={-1} className="min-h-screen p-4 sm:p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none">
      {/* Center content within the full-width container */}
      <div className="max-w-5xl mx-auto"> {/* Optional: Reintroduce a max-width for content if needed, or remove */}
          <h1 className="text-center text-3xl font-bold mt-0 mb-8 text-gray-800 dark:text-gray-200">Typing Practice Master</h1>

      <CodeSelector
        // Use snippets and selectedSnippetId from atoms
        snippets={snippets.map(s => ({ id: s.id, name: s.name }))}
        selectedId={selectedSnippetId}
        onSelect={handleSnippetChange} // Uses atom setter internally now
        disabled={isTyping && !isFinished} // Uses local state
      />

      <div className="mt-6 mb-6 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden shadow-inner">
        <Editor
          height="480px"
          // Use language and code from atoms
          language={currentLanguage}
          value={currentCode} // Editor value controlled by atom
          theme={window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? "typing-theme-dark" : "typing-theme-light"}
          options={editorOptions}
          onMount={handleEditorDidMount} // Uses atom values internally now
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
          // Restart triggers handleSnippetChange which uses the atom setter
          onClick={() => handleSnippetChange(selectedSnippetId)}
          className="block mx-auto mt-8 py-2 px-6 text-lg font-medium cursor-pointer rounded-md border border-transparent bg-blue-600 text-white transition duration-200 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Restart ({snippets.find(s => s.id === selectedSnippetId)?.name})
        </button>
      )}
      </div> {/* Close inner centering div */}
    </div>
  );
}

export default App;
