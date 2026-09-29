import React, { useState } from 'react'
import type { CodeSymbol } from '../utils/symbols'

interface SymbolsPaneProps {
  symbols: CodeSymbol[]
  activeLine: number | null
  onSelect: (symbol: CodeSymbol) => void
}

// Short labels shown before each symbol, similar to GitHub's symbols pane
const KIND_LABELS: { [kind: string]: string } = {
  function: 'func',
  method: 'func',
  constructor: 'func',
  getter: 'get',
  setter: 'set',
  class: 'class',
  interface: 'intf',
  type: 'type',
  enum: 'enum',
  const: 'const',
  let: 'var',
  var: 'var',
}

const SymbolsPane: React.FC<SymbolsPaneProps> = ({ symbols, activeLine, onSelect }) => {
  const [filter, setFilter] = useState('')

  const query = filter.trim().toLowerCase()
  const visibleSymbols = query
    ? symbols.filter((symbol) => symbol.name.toLowerCase().includes(query))
    : symbols

  return (
    <aside className='flex max-h-full flex-col rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'>
      <div className='border-b border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold'>
        Symbols
      </div>
      <div className='px-3 pt-3'>
        <input
          type='text'
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder='Filter symbols'
          className='w-full py-1 px-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        />
      </div>
      <ul className='min-h-0 flex-1 overflow-y-auto p-2 text-sm'>
        {visibleSymbols.length === 0 && (
          <li className='px-2 py-1 text-gray-500 dark:text-gray-400'>No symbols found</li>
        )}
        {visibleSymbols.map((symbol) => (
          <li key={`${symbol.line}-${symbol.depth}-${symbol.name}`}>
            <button
              type='button'
              onClick={() => onSelect(symbol)}
              style={{ paddingLeft: `${0.5 + (query ? 0 : symbol.depth) * 1}rem` }}
              className={`flex w-full items-center gap-2 rounded py-1 pr-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                symbol.line === activeLine ? 'bg-blue-50 dark:bg-blue-900/30' : ''
              }`}
            >
              <span className='w-10 shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400'>
                {KIND_LABELS[symbol.kind] ?? symbol.kind}
              </span>
              <span className='truncate font-mono'>{symbol.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default SymbolsPane
