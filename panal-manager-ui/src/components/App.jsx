import { useState } from 'react';
import PersonList from './components/PersonList';
import PersonForm from './components/PersonForm';

export default function App() {
  const [personToEdit, setPersonToEdit] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setPersonToEdit(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <PersonForm personToEdit={personToEdit} onSaved={refresh} />
      <PersonList key={refreshKey} onEdit={setPersonToEdit} />
    </div>
  );
}
