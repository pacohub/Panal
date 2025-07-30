import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { PersonList } from './components/PersonLst';
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 w-full flex justify-center">
      <ToastContainer position="top-right" autoClose={3000} aria-label="Notificaciones" />
      <PersonList />
    </div>
  );
}

export default App;