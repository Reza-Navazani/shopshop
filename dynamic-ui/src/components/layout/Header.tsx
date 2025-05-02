import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

// Use the same ViewType that's defined in App.tsx
type ViewType = 'boxes' | 'scanner' | 'history' | 'profile' | 'login' | 'preferences';

interface HeaderProps {
  onNavigate: (view: ViewType) => void;
  currentView: ViewType;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Add scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleLogout = () => {
    logout();
    onNavigate('boxes');
  };

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-sm shadow-md' : 'bg-white shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Shop Assist Agent
              </h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <button
                onClick={() => onNavigate('boxes')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                  currentView === 'boxes'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => onNavigate('scanner')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                  currentView === 'scanner'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Scanner
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => onNavigate('history')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                    currentView === 'history'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Scan History
                </button>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated && (
              <button
                onClick={() => onNavigate('preferences')}
                className={`inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                  currentView === 'preferences'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                My Preferences
              </button>
            )}
            
            {isAuthenticated ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu"
                    aria-expanded={showMenu}
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-10 w-10 rounded-full ring-2 ring-blue-100 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm">
                      {user?.username.charAt(0).toUpperCase()}
                    </div>
                  </button>
                </div>
                {showMenu && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200 ease-out"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      role="menuitem"
                    >
                      Your Profile
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('preferences');
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      role="menuitem"
                    >
                      My Preferences
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Sign in
              </button>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${showMenu ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${showMenu ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`${showMenu ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <button
            onClick={() => {
              onNavigate('boxes');
              setShowMenu(false);
            }}
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left transition-colors duration-150 ${
              currentView === 'boxes'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => {
              onNavigate('scanner');
              setShowMenu(false);
            }}
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left transition-colors duration-150 ${
              currentView === 'scanner'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            Scanner
          </button>
          {isAuthenticated && (
            <>
              <button
                onClick={() => {
                  onNavigate('history');
                  setShowMenu(false);
                }}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left transition-colors duration-150 ${
                  currentView === 'history'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                Scan History
              </button>
              <button
                onClick={() => {
                  onNavigate('preferences');
                  setShowMenu(false);
                }}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left transition-colors duration-150 ${
                  currentView === 'preferences'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                My Preferences
              </button>
            </>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          {isAuthenticated ? (
            <>
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full ring-2 ring-blue-100 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-lg shadow-sm">
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.username}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-150"
                >
                  Your Profile
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-150"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="mt-3 px-4 pb-4">
              <button
                onClick={() => {
                  onNavigate('login');
                  setShowMenu(false);
                }}
                className="w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};