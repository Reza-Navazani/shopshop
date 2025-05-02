import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const AuthPage: React.FC = () => {
  const [showLogin, setShowLogin] = useState(true);
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Shop Assist Agent</h1>
          <p className="mt-2 text-sm text-gray-600">
            {showLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>
        
        {showLogin ? (
          <LoginForm onRegisterClick={() => setShowLogin(false)} />
        ) : (
          <RegisterForm onLoginClick={() => setShowLogin(true)} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;