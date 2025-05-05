import React from 'react';

interface StatsDisplayProps {
  wpm: number; // Words Per Minute
  accuracy: number; // Accuracy percentage
  timeElapsed: number; // Time elapsed in seconds
  totalWords: number; // Total words in the current snippet
  // TODO: Add more stats if needed (e.g., errors, total chars)
}

// Helper component for individual stat items with optional separator
const StatItem: React.FC<{ label: string; value: string | number; showSeparator?: boolean }> = ({ label, value, showSeparator = true }) => (
  <div className="flex items-center px-3 sm:px-4">
    {/* Optional: Add icons here later */}
    <span className="text-xs sm:text-sm mr-1 opacity-80">{label}:</span>
    <span className="text-sm sm:text-base font-medium">{value}</span>
    {/* Adjust separator color for better contrast on emerald background */}
    {showSeparator && <div className="h-4 w-px bg-emerald-500 opacity-50 ml-3 sm:ml-4"></div>}
  </div>
);


const StatsDisplay: React.FC<StatsDisplayProps> = ({ wpm, accuracy, timeElapsed, totalWords }) => {
  return (
    // Container: flex layout, centered vertically, justify center horizontally,
    // rounded corners, background with opacity, padding, margin
    <div className="flex items-center justify-center mt-6 py-2 px-6 rounded-full bg-emerald-700 backdrop-blur-sm text-white shadow-lg max-w-md mx-auto"> {/* Increased horizontal padding from px-2 to px-6 */}
        <StatItem label="WPM" value={wpm} />
        <StatItem label="Acc" value={`${accuracy.toFixed(0)}%`} />
        <StatItem label="Words" value={totalWords} /> {/* Display total words */}
        <StatItem label="Time" value={`${timeElapsed.toFixed(0)}s`} showSeparator={false} /> {/* No separator after the last item */}
        {/* Add more StatItems here if needed */}
    </div>
  );
};

export default StatsDisplay;