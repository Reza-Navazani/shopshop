import { useState } from 'react'
import './App.css'
import DynamicTextBoxes from './DynamicTextBoxes'
import BarcodeScanner from './components/BarcodeScanner'

function App() {
  const [currentView, setCurrentView] = useState<'boxes' | 'scanner'>('boxes')

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <nav className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dynamic App</h1>
        <div className="space-x-4">
          <button
            onClick={() => setCurrentView('boxes')}
            className={`px-4 py-2 rounded-lg ${
              currentView === 'boxes' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Text Boxes
          </button>
          <button
            onClick={() => setCurrentView('scanner')}
            className={`px-4 py-2 rounded-lg ${
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
