import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { preact } from '../snippet/js'; // Assuming preact snippet is here

// --- Interfaces ---
// Duplicated from App.tsx for now, consider moving to a shared types file
interface CodeSnippet {
  id: string;
  name: string;
  language: string;
  code: string;
}

// --- Sample Data ---
// Duplicated from App.tsx for now, consider moving to a shared data file
const initialSnippets: CodeSnippet[] = [
  { id: 'js1', name: 'Preact (JS)', language: 'javascript', code: preact },
  { id: 'py1', name: 'Python: Simple Function', language: 'python', code: "def greet(name):\n  print(f'Hello, {name}!')" },
  { id: 'ts1', name: 'TypeScript: Interface', language: 'typescript', code: "interface User {\n  name: string;\n  id: number;\n}" },
];

// --- Jotai Atoms ---

// Atom for the list of snippets (could be loaded from API later)
export const snippetsAtom = atom<CodeSnippet[]>(initialSnippets);

// Atom for the ID of the currently selected snippet
// atomWithStorage handles reading from localStorage. Provide the default value to use if nothing is found.
const defaultSnippetId = initialSnippets[0]?.id || '';
export const selectedSnippetIdAtom = atomWithStorage<string>(
    'typing-master-selected-id', // key
    defaultSnippetId,            // initialValue
    undefined,                   // storage (use default localStorage)
    { getOnInit: true }          // options
);


// Atom to store all user inputs, keyed by snippet ID, persisted to localStorage
const allUserInputsAtom = atomWithStorage<{ [key: string]: string | undefined }>(
    'typing-master-all-inputs', // key
    {},                         // initialValue
    undefined,                  // storage (use default localStorage)
    { getOnInit: true }         // options
);

// Derived atom for the user input of the *currently selected* snippet
// Assuming getOnInit makes the initial read synchronous, direct access should work.
export const currentUserInputAtom = atom(
  (get) => {
    const selectedId = get(selectedSnippetIdAtom);
    const allInputs = get(allUserInputsAtom);
    return allInputs[selectedId] || ''; // Return saved input or empty string
  },
  (get, set, newInput: string) => {
    const selectedId = get(selectedSnippetIdAtom);
    // Ensure selectedId is valid before updating
    if (!selectedId) {
        console.error("Attempted to set input without a selected snippet ID.");
        return;
    }
    const currentInputs = get(allUserInputsAtom);
    set(allUserInputsAtom, {
      ...currentInputs,
      [selectedId]: newInput, // Update input for the current snippet
    });
  }
);

// Atom for the currently selected snippet object
export const selectedSnippetAtom = atom((get) => {
  const snippets = get(snippetsAtom);
  const selectedId = get(selectedSnippetIdAtom);
  return snippets.find(s => s.id === selectedId) || null; // Return null if not found
});

// Atom for the code of the selected snippet
export const currentCodeAtom = atom((get) => get(selectedSnippetAtom)?.code ?? ''); // Use nullish coalescing

// Atom for the language of the selected snippet
export const currentLanguageAtom = atom((get) => get(selectedSnippetAtom)?.language ?? 'javascript'); // Use nullish coalescing

// Atom for the number of words typed by the user for the current snippet
export const typedWordsAtom = atom((get) => {
  const input = get(currentUserInputAtom) || '';
  // Split by whitespace, filter empty strings, count words
  return input.trim().split(/\s+/).filter(Boolean).length;
});