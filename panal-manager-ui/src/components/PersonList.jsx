import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function PersonList({ onEdit }) {
    const [people, setPeople] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3000/people')
            .then(res => res.json())
            .then(data => setPeople(data));
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta persona?')) return;
        try {
            const res = await fetch(`http://localhost:3000/people/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar persona');
            setPeople(people.filter(p => p.id !== id));
            toast.success('Persona eliminada con éxito');
        } catch (error) {
            toast.error('No se pudo eliminar la persona');
        }
    };

    return (
        <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">Personas</h2>
            <table className="w-full border">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="p-2 border">ID</th>
                        <th className="p-2 border">Nombre</th>
                        <th className="p-2 border">Email</th>
                        <th className="p-2 border">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {people.map(person => (
                        <tr key={person.id}>
                            <td className="p-2 border">{person.id}</td>
                            <td className="p-2 border">{person.name}</td>
                            <td className="p-2 border">{person.email}</td>
                            <td className="p-2 border flex gap-2">
                                <button onClick={() => onEdit(person)} className="bg-yellow-400 px-2 rounded">Editar</button>
                                <button onClick={() => handleDelete(person.id)} className="bg-red-500 text-white px-2 rounded">Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
