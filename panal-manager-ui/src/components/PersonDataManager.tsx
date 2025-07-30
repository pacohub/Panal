import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';


interface PersonData {
  id: number;
  personId: number;
  dataTypeId: number;
  value: string;
  fileName?: string; // Nuevo atributo opcional para nombre de archivo
  dataType: {
    id: number;
    name: string;
    type: string;
  };
}

interface DataType {
  id: number;
  name: string;
  type: 'text' | 'number' | 'date' | 'email' | 'url' | 'boolean' | 'image' | 'file';
  required: boolean;
  isActive: boolean;
}

interface CreatePersonDataDto {
  personId: number;
  dataTypeId: number;
  value: string;
  fileName?: string; // Nuevo atributo opcional para nombre de archivo
}


interface PersonDataManagerProps {
  personId: number;
  personName: string;
  onDataChanged?: () => void;
  // Paginación datos dinámicos
  paginatedPersonData?: PersonData[];
  dataPage?: number;
  dataRowsPerPage?: number;
  handleDataPageChange?: (n: number) => void;
  handleDataRowsPerPageChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  // Paginación tipos de datos
  paginatedDataTypes?: DataType[];
  typePage?: number;
  typeRowsPerPage?: number;
  handleTypePageChange?: (n: number) => void;
  handleTypeRowsPerPageChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  totalData?: number;
  totalTypes?: number;
}

export const PersonDataManager: React.FC<PersonDataManagerProps> = ({
  personId, personName, onDataChanged,
  paginatedPersonData, dataPage = 1, dataRowsPerPage = 10, handleDataPageChange, handleDataRowsPerPageChange, totalData = 0,
  paginatedDataTypes, typePage = 1, typeRowsPerPage = 10, handleTypePageChange, handleTypeRowsPerPageChange, totalTypes = 0
}) => {
  const [personData, setPersonData] = useState<PersonData[]>([]);
  const [dataTypes, setDataTypes] = useState<DataType[]>([]);
  // Buscadores
  const [searchPersonData, setSearchPersonData] = useState('');
  const [searchDataType, setSearchDataType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDataTypeModal, setShowDataTypeModal] = useState(false);
  const [showNewDataTypeModal, setShowNewDataTypeModal] = useState(false);
  const [editingData, setEditingData] = useState<PersonData | null>(null);
  const [editingDataType, setEditingDataType] = useState<DataType | null>(null);
  const [formData, setFormData] = useState<CreatePersonDataDto>({
    personId,
    dataTypeId: 0,
    value: '',
    fileName: '',
  });
  const [dataTypeForm, setDataTypeForm] = useState({
    name: '',
    type: 'text' as 'text' | 'number' | 'date' | 'email' | 'url' | 'boolean' | 'image' | 'file',
    required: false,
    isActive: true,
  });

  // Modal handlers for DataType management
  const openDataTypeModal = () => {
    setEditingDataType(null);
    setDataTypeForm({
      name: '',
      type: 'text',
      required: false,
      isActive: true,
    });
    setShowDataTypeModal(true);
  };

  const closeDataTypeModal = () => {
    setShowDataTypeModal(false);
    setEditingDataType(null);
  };

  const openNewDataTypeModal = () => {
    setShowNewDataTypeModal(true);
    setEditingDataType(null);
    setDataTypeForm({
      name: '',
      type: 'text',
      required: false,
      isActive: true,
    });
  };

  useEffect(() => {
    fetchPersonData();
    fetchDataTypes();
  }, [personId]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const fetchPersonData = async () => {
    try {
      const response = await fetch(`${apiUrl}/person-data/person/${personId}`);
      if (response.ok) {
        let data = await response.json();
        // Compatibilidad: si fileName no existe, ponerlo en blanco
        data = data.map((d: any) => {
          if ((d.dataType?.type === 'image' || d.dataType?.type === 'file') && d.fileName === undefined) {
            return { ...d, fileName: '' };
          }
          return d;
        });
        setPersonData(data);
      }
    } catch (error) {
      toast.error('Error al cargar datos de la persona');
    }
  };

  const fetchDataTypes = async () => {
    try {
      const response = await fetch(`${apiUrl}/data-type`);
      if (response.ok) {
        const data = await response.json();
        setDataTypes(data);
      }
    } catch (error) {
      toast.error('Error al cargar tipos de datos');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: CreatePersonDataDto) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación según el tipo de dato seleccionado
    const selectedType = dataTypes.find(dt => dt.id === Number(formData.dataTypeId))?.type;
    const value = formData.value;
    let isValid = true;
    let errorMsg = '';
    if (selectedType === 'number') {
      if (isNaN(Number(value))) {
        isValid = false;
        errorMsg = 'El valor debe ser un número válido.';
      }
    } else if (selectedType === 'date') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || isNaN(Date.parse(value))) {
        isValid = false;
        errorMsg = 'El valor debe ser una fecha válida (YYYY-MM-DD).';
      }
    } else if (selectedType === 'email') {
      if (!/^\S+@\S+\.\S+$/.test(value)) {
        isValid = false;
        errorMsg = 'El valor debe ser un email válido.';
      }
    } else if (selectedType === 'url') {
      try {
        new URL(value);
      } catch {
        isValid = false;
        errorMsg = 'El valor debe ser una URL válida.';
      }
    } else if (selectedType === 'boolean') {
      if (!(value === 'true' || value === 'false' || value === '1' || value === '0')) {
        isValid = false;
        errorMsg = 'El valor debe ser booleano (true/false, 1/0).';
      }
    }

    if (!isValid) {
      toast.error(errorMsg);
      return;
    }

    try {
      const url = editingData 
        ? `${apiUrl}/person-data/${editingData.id}`
        : `${apiUrl}/person-data`;
      const method = editingData ? 'PATCH' : 'POST';
      // Solo enviar fileName si es image o file
      const selectedType = dataTypes.find(dt => dt.id === Number(formData.dataTypeId))?.type;
      let body: any = { ...formData };
      if (selectedType !== 'image' && selectedType !== 'file') {
        delete body.fileName;
      }
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingData ? 'Dato actualizado' : 'Dato agregado');
        setShowModal(false);
        setEditingData(null);
        setFormData({
          personId,
          dataTypeId: 0,
          value: '',
          fileName: '',
        });
        fetchPersonData();
        if (onDataChanged) onDataChanged();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Error al guardar dato');
      }
    } catch (error) {
      toast.error('Error al guardar dato');
    }
  };

  const handleEdit = (data: PersonData) => {
    setEditingData(data);
    setFormData({
      personId: data.personId,
      dataTypeId: data.dataTypeId,
      value: data.value,
      fileName: data.fileName || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este dato?')) {
      try {
        const response = await fetch(`${apiUrl}/person-data/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Dato eliminado');
          fetchPersonData();
        } else {
          toast.error('Error al eliminar dato');
        }
      } catch (error) {
        toast.error('Error al eliminar dato');
      }
    }
  };

  const openModal = () => {
    setEditingData(null);
    setFormData({
      personId,
      dataTypeId: 0,
      value: '',
      fileName: '',
    });
    setShowModal(true);
  };

  const closeNewDataTypeModal = () => {
    setShowNewDataTypeModal(false);
    setEditingDataType(null);
    setDataTypeForm({
      name: '',
      type: 'text',
      required: false,
      isActive: true,
    });
  };

  const handleDataTypeFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : undefined;
    setDataTypeForm((prev: typeof dataTypeForm) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDataTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingDataType 
        ? `${apiUrl}/data-type/${editingDataType.id}`
        : `${apiUrl}/data-type`;
      
      const method = editingDataType ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataTypeForm),
      });

      if (response.ok) {
        toast.success(editingDataType ? 'Tipo de dato actualizado' : 'Tipo de dato creado');
        if (showNewDataTypeModal) {
          closeNewDataTypeModal();
        } else {
          closeDataTypeModal();
        }
        fetchDataTypes();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Error al guardar tipo de dato');
      }
    } catch (error) {
      toast.error('Error al guardar tipo de dato');
    }
  };

  const getDataTypeName = (dataTypeId: number) => {
    const dataType = dataTypes.find((dt: DataType) => dt.id === dataTypeId);
    return dataType ? dataType.name : 'Desconocido';
  };

  // Paginador genérico
  function Paginator({ current, total, onPageChange }: { current: number, total: number, onPageChange: (n: number) => void }) {
    if (total <= 1) return null;
    const pages: number[] = [];
    for (let i = 1; i <= total; i++) pages.push(i);
    return (
      <div className="flex items-center justify-center space-x-1 mt-2">
        <button disabled={current === 1} onClick={() => onPageChange(current - 1)} className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50">&lt;</button>
        {pages.map(p => (
          <button key={p} onClick={() => onPageChange(p)} className={`px-2 py-1 rounded ${p === current ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>{p}</button>
        ))}
        <button disabled={current === total} onClick={() => onPageChange(current + 1)} className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50">&gt;</button>
      </div>
    );
  }

  // ...existing code...
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Datos Dinámicos - {personName}
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={openDataTypeModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <i className="fas fa-cog mr-2"></i>
                Gestionar Tipos
              </button>
              <button
                onClick={openModal}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Agregar Dato
              </button>
            </div>
          </div>
        </div>

        {/* Buscador para datos dinámicos */}
        <div className="px-6 pt-4 flex justify-end">
          <input
            type="text"
            className="border border-gray-300 rounded-md px-3 py-1 text-sm w-64"
            placeholder="Buscar dato por nombre..."
            value={searchPersonData}
            onChange={e => setSearchPersonData(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <div className="flex items-center justify-between px-4 py-2">
            <div>
              <label className="mr-2 text-sm">Filas por página:</label>
              <select value={dataRowsPerPage} onChange={handleDataRowsPerPageChange} className="border rounded px-2 py-1 text-sm">
                {[5, 10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <span className="text-sm">Página {dataPage} de {Math.max(1, Math.ceil(totalData / dataRowsPerPage))}</span>
            </div>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Dato
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {(paginatedPersonData || personData
                .filter((data: PersonData) => {
                  const dt = dataTypes.find(dt => dt.id === data.dataTypeId);
                  return !searchPersonData || (dt && dt.name.toLowerCase().includes(searchPersonData.toLowerCase()));
                })
                .slice(0, dataRowsPerPage))
                .map((data: PersonData) => (
                <tr key={data.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                    {getDataTypeName(data.dataTypeId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {(() => {
                      const dt = dataTypes.find((dt: DataType) => dt.id === data.dataTypeId);
                      if (dt?.type === 'image' || dt?.type === 'file') {
                        if (data.fileName && data.fileName.trim() !== '') {
                          return data.fileName;
                        } else if (data.value && typeof data.value === 'string' && data.value.startsWith('data:')) {
                          return 'Archivo sin nombre';
                        } else {
                          return '';
                        }
                      } else {
                        return data.value;
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    <button
                      onClick={() => handleEdit(data)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(data.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginator current={dataPage} total={Math.max(1, Math.ceil(totalData / dataRowsPerPage))} onPageChange={handleDataPageChange!} />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingData ? 'Editar Dato' : 'Agregar Dato'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Dato</label>
                  <select
                    name="dataTypeId"
                    value={formData.dataTypeId}
                    onChange={handleFormChange}
                    className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar tipo de dato</option>
                    {dataTypes.map((dataType: DataType) => (
                      <option key={dataType.id} value={dataType.id}>
                      {dataType.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor</label>
                  {(() => {
                    const selectedType = dataTypes.find((dt: DataType) => dt.id === Number(formData.dataTypeId))?.type;
                    if (selectedType === 'date') {
                      return (
                        <input
                          type="date"
                          name="value"
                          value={formData.value}
                          onChange={handleFormChange}
                          className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      );
                    } else if (selectedType === 'email') {
                      return (
                        <input
                          type="email"
                          name="value"
                          value={formData.value}
                          onChange={handleFormChange}
                          className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      );
                    } else if (selectedType === 'url') {
                      return (
                        <input
                          type="url"
                          name="value"
                          value={formData.value}
                          onChange={handleFormChange}
                          className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      );
                    } else if (selectedType === 'boolean') {
                      return (
                        <input
                          type="checkbox"
                          name="value"
                          checked={formData.value === 'true' || formData.value === '1'}
                          onChange={e => setFormData((prev: CreatePersonDataDto) => ({
                            ...prev,
                            value: e.target.checked ? 'true' : 'false',
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-2"
                        />
                      );
                    } else if (selectedType === 'image') {
                      return (
                        <input
                          type="file"
                          name="value"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = ev => {
                                setFormData((prev: CreatePersonDataDto) => ({ ...prev, value: ev.target?.result as string || '', fileName: file.name }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      );
                    } else if (selectedType === 'file') {
                      return (
                        <input
                          type="file"
                          name="value"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = ev => {
                                setFormData((prev: CreatePersonDataDto) => ({ ...prev, value: ev.target?.result as string || '', fileName: file.name }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      );
                    } else if (selectedType === 'number') {
                      return (
                        <input
                          type="number"
                          name="value"
                          value={formData.value}
                          onChange={handleFormChange}
                          className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      );
                    } else {
                      return (
                        <input
                          type="text"
                          name="value"
                          value={formData.value}
                          onChange={handleFormChange}
                          className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      );
                    }
                  })()}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    {editingData ? 'Actualizar' : 'Agregar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Data Type Management Modal */}
      {showDataTypeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Gestión de Tipos de Datos
                </h3>
                <button onClick={closeDataTypeModal} className="text-gray-400 hover:text-gray-500">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="mb-4 flex items-center gap-4">
                <button
                  onClick={openNewDataTypeModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors mb-3"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Nuevo Tipo de Dato
                </button>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm w-64 mb-3"
                  placeholder="Buscar tipo de dato por nombre..."
                  value={searchDataType}
                  onChange={e => setSearchDataType(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between px-4 py-2">
                  <div>
                    <label className="mr-2 text-sm">Filas por página:</label>
                    <select value={typeRowsPerPage} onChange={handleTypeRowsPerPageChange} className="border rounded px-2 py-1 text-sm">
                      {[5, 10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="text-sm">Página {typePage} de {Math.max(1, Math.ceil(totalTypes / typeRowsPerPage))}</span>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requerido
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {(paginatedDataTypes || dataTypes
                        .filter((dataType: DataType) => !searchDataType || dataType.name.toLowerCase().includes(searchDataType.toLowerCase()))
                        .slice(0, typeRowsPerPage))
                        .map((dataType: DataType) => (
                        <tr key={dataType.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                            {dataType.name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                            {dataType.type}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                            {dataType.required ? 'Sí' : 'No'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                            {dataType.isActive ? 'Activo' : 'Inactivo'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-center">
                            <button
                              onClick={() => {
                                setEditingDataType(dataType);
                                setDataTypeForm({
                                  name: dataType.name,
                                  type: dataType.type as 'text' | 'number' | 'date' | 'email' | 'url' | 'boolean' | 'image' | 'file',
                                  required: dataType.required,
                                  isActive: dataType.isActive,
                                });
                                setShowNewDataTypeModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-2"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Paginator current={typePage} total={Math.max(1, Math.ceil(totalTypes / typeRowsPerPage))} onPageChange={handleTypePageChange!} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New/Edit Data Type Modal */}
      {showNewDataTypeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingDataType ? 'Editar Tipo de Dato' : 'Nuevo Tipo de Dato'}
                </h3>
                <button onClick={() => { closeNewDataTypeModal(); setEditingDataType(null); }} className="text-gray-400 hover:text-gray-500">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleDataTypeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={dataTypeForm.name}
                    onChange={handleDataTypeFormChange}
                    className="block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    name="type"
                    value={dataTypeForm.type}
                    onChange={handleDataTypeFormChange}
                    className="block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="date">Fecha</option>
                    <option value="email">Email</option>
                    <option value="url">URL</option>
                    <option value="boolean">Booleano</option>
                    <option value="image">Imagen</option>
                    <option value="file">Archivo</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="required"
                      checked={dataTypeForm.required}
                      onChange={handleDataTypeFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Requerido</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={dataTypeForm.isActive}
                      onChange={handleDataTypeFormChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Activo</label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { closeNewDataTypeModal(); setEditingDataType(null); }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    {editingDataType ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// End of PersonDataManager component