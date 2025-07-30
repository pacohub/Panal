import React, { useState } from 'react';
import { PersonList } from './PersonLst';
import { DataTypeManager } from './DataTypeManager';
import { ToastContainer } from 'react-toastify';

function App() {
  const [currentView, setCurrentView] = useState<'people' | 'dataTypes'>('people');

  return (
    <div className="min-h-screen bg-white w-full flex justify-center">
      <div className="w-full max-w-7xl">
        {/* Navigation Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Gestión</h1>
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView('people')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'people'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <i className="fas fa-users mr-2"></i>
                Personas
              </button>
              <button
                onClick={() => setCurrentView('dataTypes')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'dataTypes'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <i className="fas fa-database mr-2"></i>
                Tipos de Datos
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {currentView === 'people' ? <PersonList /> : <DataTypeManager />}
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} aria-label="Notificaciones" />
    </div>
  );
}

export default App; 