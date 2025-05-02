import { useState } from 'react'
import './App.css'
import DynamicTextBoxes from './DynamicTextBoxes'
import BarcodeScanner from './components/BarcodeScanner'
import { AuthProvider } from './context/AuthContext'
import { Header } from './components/layout/Header'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import ScanHistoryPage from './pages/ScanHistoryPage'
import UserPreferencesPage from './pages/UserPreferencesPage'

// Define a valid type for navigation views to ensure type safety
type ViewType = 'boxes' | 'scanner' | 'history' | 'profile' | 'login' | 'preferences';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('boxes')

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
    // Scroll to top when navigating
    window.scrollTo(0, 0);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'boxes':
        return <DynamicTextBoxes />;
      case 'scanner':
        return <BarcodeScanner />;
      case 'history':
        return <ScanHistoryPage />;
      case 'profile':
        return <ProfilePage />;
      case 'login':
        return <AuthPage />;
      case 'preferences':
        return <UserPreferencesPage onNavigate={handleNavigate} />;
      default:
        return <DynamicTextBoxes />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header onNavigate={handleNavigate} currentView={currentView} />
        <main className="flex-grow pt-16 px-4 sm:px-6 lg:px-8 mt-4">
          <div className="max-w-7xl mx-auto w-full">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              {renderCurrentView()}
            </div>
          </div>
        </main>
        <footer className="bg-white border-t border-gray-200 py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} Shop Assist Agent. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </AuthProvider>
  )
}

export default App
