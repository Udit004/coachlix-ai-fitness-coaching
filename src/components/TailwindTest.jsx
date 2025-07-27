"use client";

export default function TailwindTest() {
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-8 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Tailwind Dark Mode Test
      </h2>
      
      <div className="space-y-4">
        {/* Background test */}
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
          <p className="text-gray-800 dark:text-gray-200">
            Background should change: gray-100 → gray-700
          </p>
        </div>
        
        {/* Text color test */}
        <div>
          <p className="text-black dark:text-white">
            Text: black → white
          </p>
          <p className="text-blue-600 dark:text-blue-400">
            Blue text: blue-600 → blue-400
          </p>
        </div>
        
        {/* Border test */}
        <div className="p-3 border border-gray-300 dark:border-gray-600 rounded">
          <p className="text-gray-700 dark:text-gray-300">
            Border: gray-300 → gray-600
          </p>
        </div>
        
        {/* Color squares */}
        <div className="flex space-x-2">
          <div className="w-8 h-8 bg-red-500 dark:bg-red-400 rounded"></div>
          <div className="w-8 h-8 bg-green-500 dark:bg-green-400 rounded"></div>
          <div className="w-8 h-8 bg-blue-500 dark:bg-blue-400 rounded"></div>
          <div className="w-8 h-8 bg-yellow-500 dark:bg-yellow-400 rounded"></div>
        </div>
        
        {/* Manual class toggle test */}
        <button 
          onClick={() => {
            const html = document.documentElement;
            if (html.classList.contains('dark')) {
              html.classList.remove('dark');
              html.classList.add('light');
              console.log('Manually switched to light');
            } else {
              html.classList.remove('light');
              html.classList.add('dark');
              console.log('Manually switched to dark');
            }
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded"
        >
          Manual Toggle Test
        </button>
      </div>
    </div>
  );
}