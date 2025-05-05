import React from 'react';

// Define the structure of a code snippet expected by this component
interface SnippetInfo {
  id: string;
  name: string;
}

interface CodeSelectorProps {
  snippets: SnippetInfo[]; // Array of available snippets (only need id and name)
  selectedId: string;      // The ID of the currently selected snippet
  onSelect: (id: string) => void; // Callback function when a snippet is selected
  disabled?: boolean; // Optional prop to disable the selector
}

const CodeSelector: React.FC<CodeSelectorProps> = ({ snippets, selectedId, onSelect, disabled = false }) => {

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSelect(event.target.value); // Call the callback with the new selected ID
  };

  return (
    <div className="text-center">
      {/* Apply Tailwind classes for the label: right margin, bold font */}
      <label htmlFor="snippet-select" className="mr-2 font-medium text-gray-700 dark:text-gray-300">Select Code:</label>
      {/* Apply Tailwind classes for the select dropdown: padding, border, rounded corners, background/text colors, focus ring */}
      <select
        id="snippet-select"
        value={selectedId}
        onChange={handleChange}
        disabled={disabled}
        className="py-1 px-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* Option for loading state */}
        {snippets.length === 0 && <option disabled>Loading snippets...</option>}
        {/* Map through snippets to create options */}
        {snippets.map((snippet) => (
          <option key={snippet.id} value={snippet.id}>
            {snippet.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CodeSelector;