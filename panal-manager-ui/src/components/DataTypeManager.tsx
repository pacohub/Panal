import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface DataType {
  id: number;
  name: string;
  type: 'text' | 'number' | 'date' | 'email' | 'url' | 'boolean';
  required: boolean;
  isActive: boolean;
}

// interface CreateDataTypeDto eliminada

export const DataTypeManager: React.FC = () => {
  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este tipo de dato?')) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/data-type/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          toast.success('Tipo de dato eliminado');
          fetchDataTypes();
        } else {
          toast.error('Error al eliminar tipo de dato');
        }
      } catch (error) {
        toast.error('Error al eliminar tipo de dato');
      }
    }
  };
  const [dataTypes, setDataTypes] = useState<DataType[]>([]);
  // Eliminado: estados y lógica de formulario modal

  useEffect(() => {
    fetchDataTypes();
  }, []);

  const fetchDataTypes = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/data-type`);
      if (response.ok) {
        const data = await response.json();
        setDataTypes(data);
      }
    } catch (error) {
      toast.error('Error al cargar tipos de datos');
    }
  };

  // Eliminado: handleFormChange sobrante

  // Eliminado: bloque sobrante de funciones de formulario modal

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Gestión de Tipos de Datos</h2>
            {/* Botón de nuevo tipo de dato eliminado */}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>

                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requerido
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {dataTypes.map((dataType) => (
                <tr key={dataType.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                    {dataType.name}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {dataType.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {dataType.required ? 'Sí' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {dataType.isActive ? 'Activo' : 'Inactivo'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    {/* Botón de editar eliminado */}
                    <button
                      onClick={() => handleDelete(dataType.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {/* Formulario modal eliminado */}
    </div>
  );
}; 