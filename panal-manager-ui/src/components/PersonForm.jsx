import { useState, useEffect } from 'react';

export default function PersonForm({ personToEdit, onSaved }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (personToEdit) {
      setName(personToEdit.name);
      setEmail(personToEdit.email);
    } else {
      setName('');
      setEmail('');
    }
  }, [personToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { name, email };

    if (personToEdit) {
      await fetch(`http://localhost:3000/people/${personToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      await fetch('http://localhost:3000/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }

    onSaved(); // recarga lista
    setName('');
    setEmail('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white shadow rounded space-y-2">
      <h2 className="text-xl font-bold">{personToEdit ? 'Editar' : 'Agregar'} persona</h2>
      <input className="border p-2 w-full" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} required />
      <input className="border p-2 w-full" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <button className="bg-blue-600 text-white px-4 py-2 rounded">{personToEdit ? 'Actualizar' : 'Guardar'}</button>
    </form>
  );
}
