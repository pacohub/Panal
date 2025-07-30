const API_URL = 'http://localhost:3000/person';

export async function getPersons() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Error al obtener personas');
  return res.json();
}

export async function createPerson(person: { name: string; age: number }) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(person),
  });
  if (!res.ok) throw new Error('Error al crear persona');
  return res.json();
}

export async function updatePerson(id: number, person: { name: string; age: number }) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(person),
  });
  if (!res.ok) throw new Error('Error al actualizar persona');
  return res.json();
}

export async function deletePerson(id: number) {
  const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar persona');
}
