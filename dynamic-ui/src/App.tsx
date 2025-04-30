import { useState } from 'react'
import './App.css'
import DynamicTextBoxes from './DynamicTextBoxes'
import BarcodeScanner from './components/BarcodeScanner'

function App() {
  const [currentView, setCurrentView] = useState<'boxes' | 'scanner'>('boxes')

  return (
    <div className="container mx-auto p-2 sm:p-4 min-h-screen">
      <nav className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-0">Dynamic App</h1>
        <div className="flex w-full sm:w-auto space-x-2 sm:space-x-4">
          <button
            onClick={() => setCurrentView('boxes')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg ${
              currentView === 'boxes' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Text Boxes
          </button>
          <button
            onClick={() => setCurrentView('scanner')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg ${
              currentView === 'scanner' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Scan Barcode
          </button>
        </div>
      </nav>

      {currentView === 'boxes' ? <DynamicTextBoxes /> : <BarcodeScanner />}
    </div>
  )
}

export default App
