
import React, { useEffect, useState } from "react";
// Utilidad simple para cookies
function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}
function getCookie(name: string) {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, '');
}
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PersonDataManager } from './PersonDataManager';

// Interfaz para los datos dinámicos de persona
interface PersonData {
  id: number;
  personId: number;
  dataTypeId: number;
  value: string;
  fileName?: string;
}

// DataType interface for dynamic columns
interface DataType {
  id: number;
  name: string;
  type: string;
  required: boolean;
  isActive: boolean;
}

interface Person {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  documentType?: string;
  documentNumber?: string;
  isActive?: boolean;
  registrationDate?: string;
  notes?: string;
}

export function PersonList() {
  // Estado para los datos dinámicos de todas las personas
  const [allPersonData, setAllPersonData] = useState<PersonData[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  // Obtener todos los datos dinámicos al cargar (después de declarar people)
  useEffect(() => {
    fetchAllPersonData();
  }, [people]);

  const fetchAllPersonData = async () => {
    try {
      const response = await fetch('http://localhost:3001/person-data');
      if (response.ok) {
        const data = await response.json();
        setAllPersonData(data);
      }
    } catch (error) {
      toast.error('Error al cargar datos dinámicos');
    }
  };
  // Dropdown show/hide state
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | 'selected' | null>(null);
  const [showDataManager, setShowDataManager] = useState(false);
  const [selectedPersonForData, setSelectedPersonForData] = useState<Person | null>(null);

  // Data types for dynamic columns
  const [dataTypes, setDataTypes] = useState<DataType[]>([]);

  // Column selection state
  const standardColumns = [
    { key: 'fullName', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'address', label: 'Dirección' },
    { key: 'dateOfBirth', label: 'Fecha Nac.' },
    { key: 'gender', label: 'Género' },
    { key: 'documentType', label: 'Tipo Doc.' },
    { key: 'documentNumber', label: 'Número Doc.' },
    { key: 'isActive', label: 'Estado' },
  ];
  // Persistencia de columnas seleccionadas en cookies
  const cookieKey = 'personas_selected_columns';
  const getInitialColumns = () => {
    const cookie = getCookie(cookieKey);
    if (cookie) {
      try {
        const parsed = JSON.parse(cookie);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return standardColumns.map(c => c.key);
  };
  const [selectedColumns, setSelectedColumns] = useState<string[]>(getInitialColumns());

  // Dynamic columns from dataTypes (only active)
  const dynamicColumns: { key: string; label: string; dataType: DataType }[] = dataTypes.filter((dt: DataType) => dt.isActive).map((dt: DataType) => ({
    key: `dynamic_${dt.id}`,
    label: dt.name,
    dataType: dt
  }));

  // Dropdown handler
  const handleColumnToggle = (key: string) => {
    setSelectedColumns((prev: string[]) => {
      const updated = prev.includes(key) ? prev.filter((k: string) => k !== key) : [...prev, key];
      setCookie(cookieKey, JSON.stringify(updated));
      return updated;
    });
  };

  // Sincronizar columnas seleccionadas con cookies al cargar (por si cambia la lista de columnas)
  useEffect(() => {
    setCookie(cookieKey, JSON.stringify(selectedColumns));
  }, [selectedColumns]);

  const emptyPerson = {
    id: 0,
    fullName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    documentType: "",
    documentNumber: "",
    isActive: false,
    registrationDate: "",
    notes: "",
  };
  const [formPerson, setFormPerson] = useState<Person>(emptyPerson);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchPeople();
    fetchDataTypes();
  }, []);
  // Fetch dynamic data types for columns
  const fetchDataTypes = async () => {
    try {
      const response = await fetch('http://localhost:3001/data-type');
      if (response.ok) {
        const data = await response.json();
        setDataTypes(data);
      }
    } catch (error) {
      toast.error('Error al cargar tipos de datos');
    }
  };

  const fetchPeople = () => {
    setLoading(true);
    fetch("http://localhost:3001/person")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar personas");
        return res.json();
      })
      .then((data) => {
        setPeople(data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.message);
        setLoading(false);
      });
  };

  const validatePerson = (person: Person) => {
    const errors: { [key: string]: string } = {};
    
    // Solo el nombre es obligatorio
    if (!person.fullName.trim()) {
      errors.fullName = "El nombre es obligatorio";
    }
    
    // Validar email solo si se proporciona
    if (person.email.trim()) {
      if (!/\S+@\S+\.\S+/.test(person.email)) {
      errors.email = "El email no es válido";
      } else {
        // Validar que el email no esté duplicado
        const existingPerson = people.find(p => 
          p.email.toLowerCase() === person.email.toLowerCase() && 
          p.id !== (editingPerson?.id || 0)
        );
        if (existingPerson) {
          errors.email = "Este email ya está registrado";
        }
      }
    }
    
    // Validar formato de fecha solo si se proporciona
    if (person.dateOfBirth && person.dateOfBirth.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(person.dateOfBirth)) {
        errors.dateOfBirth = "La fecha debe estar en formato YYYY-MM-DD";
      }
    }
    
    return errors;
  };

  const openAddModal = () => {
    setFormPerson(emptyPerson);
    setFormErrors({});
    setEditingPerson(null);
    setShowModal(true);
  };

  const openEditModal = (person: Person) => {
    setFormPerson(person);
    setFormErrors({});
    setEditingPerson(person);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const openDeleteModal = (target: number | 'selected') => {
    setDeleteTarget(target);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const openDataManager = (person: Person) => {
    setSelectedPersonForData(person);
    setShowDataManager(true);
  };

  const closeDataManager = () => {
    setShowDataManager(false);
    setSelectedPersonForData(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : undefined;
    setFormPerson((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validatePerson(formPerson);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (editingPerson) {
      // Edit - Only send allowed fields
      const updateData = {
        fullName: formPerson.fullName,
        email: formPerson.email || undefined,
        phone: formPerson.phone || undefined,
        address: formPerson.address || undefined,
        dateOfBirth: formPerson.dateOfBirth || undefined,
        gender: formPerson.gender || undefined,
        documentType: formPerson.documentType || undefined,
        documentNumber: formPerson.documentNumber || undefined,
        isActive: formPerson.isActive,
        notes: formPerson.notes || undefined,
      };
      
              fetch(`http://localhost:3001/person/${editingPerson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Error al actualizar persona");
          }
          return res.json();
        })
        .then(() => {
          toast.success("Persona actualizada con éxito");
          fetchPeople();
          setShowModal(false);
        })
        .catch((err) => toast.error(err.message));
    } else {
      // Create - Remove id and registrationDate, format dateOfBirth
      const createData = {
        fullName: formPerson.fullName,
        email: formPerson.email || undefined,
        phone: formPerson.phone || undefined,
        address: formPerson.address || undefined,
        dateOfBirth: formPerson.dateOfBirth || undefined,
        gender: formPerson.gender || undefined,
        documentType: formPerson.documentType || undefined,
        documentNumber: formPerson.documentNumber || undefined,
        isActive: formPerson.isActive,
        notes: formPerson.notes || undefined,
      };
      
              fetch("http://localhost:3001/person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Error al crear persona");
          }
          return res.json();
        })
        .then(() => {
          toast.success("Persona creada con éxito");
          fetchPeople();
          setShowModal(false);
        })
        .catch((err) => toast.error(err.message));
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(people.map((p) => p.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectOne = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
    if (newSelected.size !== people.length) setSelectAll(false);
    else setSelectAll(true);
  };

  const deletePerson = (id: number) => {
    openDeleteModal(id);
  };

  const deleteSelected = () => {
    openDeleteModal('selected');
  };

  const confirmDelete = () => {
    if (deleteTarget === 'selected') {
      // Delete selected people
    Promise.all(
      Array.from(selectedIds).map((id) =>
          fetch(`http://localhost:3001/person/${id}`, { method: "DELETE" })
      )
    )
      .then(() => {
        toast.success("Personas eliminadas con éxito");
        fetchPeople();
        setSelectedIds(new Set());
        setSelectAll(false);
          closeDeleteModal();
      })
        .catch(() => toast.error("Error al eliminar algunas personas"));
    } else if (deleteTarget) {
      // Delete single person
              fetch(`http://localhost:3001/person/${deleteTarget}`, {
        method: "DELETE",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error al eliminar persona");
          toast.success("Persona eliminada con éxito");
          fetchPeople();
          setSelectedIds((prev) => {
            const copy = new Set(prev);
            copy.delete(deleteTarget);
            return copy;
          });
          closeDeleteModal();
        })
        .catch((err) => toast.error(err.message));
    }
  };

  const getRoleColor = (isActive: boolean) => {
    return isActive 
      ? "bg-green-100 text-green-800" 
      : "bg-gray-100 text-gray-800";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };


  // Buscador avanzado (hooks deben ir antes de cualquier return)
  const [searchField, setSearchField] = useState<string>('fullName');
  const [searchText, setSearchText] = useState('');
  const [searchNumberMin, setSearchNumberMin] = useState('');
  const [searchNumberMax, setSearchNumberMax] = useState('');
  const [searchDateStart, setSearchDateStart] = useState('');
  const [searchDateEnd, setSearchDateEnd] = useState('');



  // Determinar opciones de búsqueda
  const allSearchableFields = [
    ...standardColumns.map(col => ({
      key: col.key,
      label: col.label,
      type: (() => {
        if (['dateOfBirth', 'registrationDate'].includes(col.key)) return 'date';
        if (['documentNumber', 'phone'].includes(col.key)) return 'number';
        if (col.key === 'isActive') return 'boolean';
        return 'text';
      })(),
      isDynamic: false,
    })),
    ...dynamicColumns.map(col => ({
      key: `dynamic_${col.dataType.id}`,
      label: col.label,
      type: (() => {
        if (col.dataType.type === 'date') return 'date';
        if (col.dataType.type === 'number') return 'number';
        if (col.dataType.type === 'image' || col.dataType.type === 'file') return 'file';
        return 'text';
      })(),
      isDynamic: true,
      dataType: col.dataType,
    }))
  ];

  // Filtrado de personas según búsqueda
  const filteredPeople = people.filter(person => {
    const field = allSearchableFields.find(f => f.key === searchField);
    if (!field) return true;
    if (!field.isDynamic) {
      const value = person[field.key as keyof Person];
      if (field.type === 'text') {
        return value?.toString().toLowerCase().includes(searchText.toLowerCase());
      } else if (field.type === 'number') {
        const num = Number(value);
        const min = searchNumberMin ? Number(searchNumberMin) : -Infinity;
        const max = searchNumberMax ? Number(searchNumberMax) : Infinity;
        return (!searchNumberMin || num >= min) && (!searchNumberMax || num <= max);
      } else if (field.type === 'date') {
        if (!value) return true;
        const date = new Date(value as string);
        const start = searchDateStart ? new Date(searchDateStart) : null;
        const end = searchDateEnd ? new Date(searchDateEnd) : null;
        return (!start || date >= start) && (!end || date <= end);
      } else if (field.type === 'boolean') {
        if (searchText === '') return true;
        return (value ? 'activo' : 'inactivo').includes(searchText.toLowerCase());
      }
      return true;
    } else {
      // Dinámico
      const dataTypeId = (field as any).dataType ? (field as any).dataType.id : null;
      if (!dataTypeId) return false;
      const datum = allPersonData.find(d => d.personId === person.id && d.dataTypeId === dataTypeId);
      if (!datum) return false;
      if (field.type === 'text') {
        return datum.value?.toLowerCase().includes(searchText.toLowerCase());
      } else if (field.type === 'number') {
        const num = Number(datum.value);
        const min = searchNumberMin ? Number(searchNumberMin) : -Infinity;
        const max = searchNumberMax ? Number(searchNumberMax) : Infinity;
        return (!searchNumberMin || num >= min) && (!searchNumberMax || num <= max);
      } else if (field.type === 'date') {
        if (!datum.value) return true;
        const date = new Date(datum.value);
        const start = searchDateStart ? new Date(searchDateStart) : null;
        const end = searchDateEnd ? new Date(searchDateEnd) : null;
        return (!start || date >= start) && (!end || date <= end);
      } else if (field.type === 'file') {
        return (datum.fileName || '').toLowerCase().includes(searchText.toLowerCase());
      }
      return true;
    }
  });

  // --- PAGINACIÓN LOCAL ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const totalPages = Math.ceil(filteredPeople.length / rowsPerPage);
  const paginatedPeople = filteredPeople.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // Resetear página si cambia el filtro o cantidad de filas
  useEffect(() => {
    setPage(0);
  }, [searchField, searchText, searchNumberMin, searchNumberMax, searchDateStart, searchDateEnd, rowsPerPage]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" aria-label="Notificaciones" />
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-gray-500">Cargando personas...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="flex flex-col items-center mb-8">
              <h1 className="text-3xl font-bold text-indigo-700 mb-4">
                <i className="fas fa-users mr-2"></i>Gestión de Personas
              </h1>
              <div className="flex space-x-2 items-center mb-4">
                <button
                  onClick={deleteSelected}
                  disabled={selectedIds.size === 0}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition flex items-center disabled:opacity-50"
                >
                  <i className="fas fa-trash-alt mr-2"></i> Eliminar Seleccionados
                </button>
                <button
                  onClick={openAddModal}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center"
                >
                  <i className="fas fa-plus-circle mr-2"></i> Agregar Persona
                </button>
              </div>
              {/* Buscador avanzado debajo de los botones, con botón columnas a la derecha del campo valor */}
              <div className="w-full max-w-3xl flex flex-col md:flex-row md:items-end md:space-x-4 space-y-2 md:space-y-0">
                <div className="flex flex-1 space-x-2 items-end">
                  {/* Label Buscar por a la izquierda del combobox */}
                  <label className="block text-sm font-medium text-gray-700 mb-1 self-center mr-2">Buscar por</label>
                  <div className="w-1/3">
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={searchField}
                      onChange={e => {
                        setSearchField(e.target.value);
                        setSearchText('');
                        setSearchNumberMin('');
                        setSearchNumberMax('');
                        setSearchDateStart('');
                        setSearchDateEnd('');
                      }}
                    >
                      {allSearchableFields.map(f => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                  {/* Inputs según tipo */}
                  {(() => {
                    const field = allSearchableFields.find(f => f.key === searchField);
                    if (!field) return null;
                    if (field.type === 'text' || field.type === 'file' || field.type === 'boolean') {
                      return (
                        <div className="flex-1 flex items-end space-x-2">
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            placeholder={field.type === 'boolean' ? 'activo/inactivo' : 'Buscar...'}
                          />
                          {/* Botón columnas a la derecha del input */}
                          <div className="relative">
                            <button
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center"
                              type="button"
                              onClick={() => setShowDropdown((prev: boolean) => !prev)}
                            >
                              <i className="fas fa-columns mr-2"></i> Columnas
                            </button>
                            {/* Dropdown menu */}
                            <div
                              style={{ display: showDropdown ? 'block' : 'none' }}
                              className="absolute z-10 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
                            >
                              <div className="font-semibold text-gray-700 mb-2">Campos estándar</div>
                              {standardColumns.map(col => (
                                <label key={col.key} className="flex items-center space-x-2 mb-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedColumns.includes(col.key)}
                                    onChange={() => handleColumnToggle(col.key)}
                                    className="form-checkbox text-indigo-600"
                                  />
                                  <span>{col.label}</span>
                                </label>
                              ))}
                              <div className="font-semibold text-gray-700 mt-2 mb-2">Campos dinámicos</div>
                              {dynamicColumns.length === 0 && (
                                <div className="text-gray-400 text-sm mb-1">No hay campos dinámicos</div>
                              )}
                              {dynamicColumns.map(col => (
                                <label key={col.key} className="flex items-center space-x-2 mb-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedColumns.includes(col.key)}
                                    onChange={() => handleColumnToggle(col.key)}
                                    className="form-checkbox text-indigo-600"
                                  />
                                  <span>{col.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    } else if (field.type === 'number') {
                      return (
                        <div className="flex-1 flex items-end space-x-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mínimo</label>
                            <input
                              type="number"
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              value={searchNumberMin}
                              onChange={e => setSearchNumberMin(e.target.value)}
                              placeholder="Min"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Máximo</label>
                            <input
                              type="number"
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              value={searchNumberMax}
                              onChange={e => setSearchNumberMax(e.target.value)}
                              placeholder="Max"
                            />
                          </div>
                          {/* Botón columnas a la derecha de los inputs */}
                          <div className="relative">
                            <button
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center"
                              type="button"
                              onClick={() => setShowDropdown((prev: boolean) => !prev)}
                            >
                              <i className="fas fa-columns mr-2"></i> Columnas
                            </button>
                            {/* Dropdown menu */}
                            <div
                              style={{ display: showDropdown ? 'block' : 'none' }}
                              className="absolute z-10 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
                            >
                              <div className="font-semibold text-gray-700 mb-2">Campos estándar</div>
                              {standardColumns.map(col => (
                                <label key={col.key} className="flex items-center space-x-2 mb-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedColumns.includes(col.key)}
                                    onChange={() => handleColumnToggle(col.key)}
                                    className="form-checkbox text-indigo-600"
                                  />
                                  <span>{col.label}</span>
                                </label>
                              ))}
                              <div className="font-semibold text-gray-700 mt-2 mb-2">Campos dinámicos</div>
                              {dynamicColumns.length === 0 && (
                                <div className="text-gray-400 text-sm mb-1">No hay campos dinámicos</div>
                              )}
                              {dynamicColumns.map(col => (
                                <label key={col.key} className="flex items-center space-x-2 mb-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedColumns.includes(col.key)}
                                    onChange={() => handleColumnToggle(col.key)}
                                    className="form-checkbox text-indigo-600"
                                  />
                                  <span>{col.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    } else if (field.type === 'date') {
                      return (
                        <div className="flex-1 flex items-end space-x-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                            <input
                              type="date"
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              value={searchDateStart}
                              onChange={e => setSearchDateStart(e.target.value)}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                            <input
                              type="date"
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              value={searchDateEnd}
                              onChange={e => setSearchDateEnd(e.target.value)}
                            />
                          </div>
                          {/* Botón columnas a la derecha de los inputs */}
                          <div className="relative">
                            <button
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center"
                              type="button"
                              onClick={() => setShowDropdown((prev: boolean) => !prev)}
                            >
                              <i className="fas fa-columns mr-2"></i> Columnas
                            </button>
                            {/* Dropdown menu */}
                            <div
                              style={{ display: showDropdown ? 'block' : 'none' }}
                              className="absolute z-10 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
                            >
                              <div className="font-semibold text-gray-700 mb-2">Campos estándar</div>
                              {standardColumns.map(col => (
                                <label key={col.key} className="flex items-center space-x-2 mb-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedColumns.includes(col.key)}
                                    onChange={() => handleColumnToggle(col.key)}
                                    className="form-checkbox text-indigo-600"
                                  />
                                  <span>{col.label}</span>
                                </label>
                              ))}
                              <div className="font-semibold text-gray-700 mt-2 mb-2">Campos dinámicos</div>
                              {dynamicColumns.length === 0 && (
                                <div className="text-gray-400 text-sm mb-1">No hay campos dinámicos</div>
                              )}
                              {dynamicColumns.map(col => (
                                <label key={col.key} className="flex items-center space-x-2 mb-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedColumns.includes(col.key)}
                                    onChange={() => handleColumnToggle(col.key)}
                                    className="form-checkbox text-indigo-600"
                                  />
                                  <span>{col.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </header>
            {/* Table Container */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden custom-scrollbar">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      {/* Render selected standard columns */}
                      {standardColumns.filter(col => selectedColumns.includes(col.key)).map(col => (
                        <th key={col.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {col.label}
                        </th>
                      ))}
                      {/* Render selected dynamic columns */}
                      {dynamicColumns.filter(col => selectedColumns.includes(col.key)).map(col => (
                        <th key={col.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {col.label}
                        </th>
                      ))}
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedPeople.map((person) => (
                      <tr
                        key={person.id}
                        className={`table-row ${selectedIds.has(person.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(person.id)}
                            onChange={() => toggleSelectOne(person.id)}
                            className="person-checkbox rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        {/* Render selected standard columns */}
                        {standardColumns.filter(col => selectedColumns.includes(col.key)).map(col => (
                          <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(() => {
                              switch (col.key) {
                                case 'fullName':
                                  return (
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <span className="text-indigo-600 font-medium">
                                          {getInitials(person.fullName)}
                                        </span>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{person.fullName}</div>
                                        <div className="text-sm text-gray-500">{person.notes}</div>
                                      </div>
                                    </div>
                                  );
                                case 'email':
                                  return person.email;
                                case 'phone':
                                  return person.phone;
                                case 'address':
                                  return person.address || '-';
                                case 'dateOfBirth':
                                  return person.dateOfBirth ? new Date(person.dateOfBirth).toLocaleDateString('es-ES') : '-';
                                case 'gender':
                                  return person.gender || '-';
                                case 'documentType':
                                  return person.documentType || '-';
                                case 'documentNumber':
                                  return person.documentNumber || '-';
                                case 'isActive':
                                  return (
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(person.isActive || false)}`}>
                                      {person.isActive ? "Activo" : "Inactivo"}
                                    </span>
                                  );
                                default:
                                  return '';
                              }
                            })()}
                          </td>
                        ))}
                        {/* Render selected dynamic columns */}
                        {dynamicColumns.filter(col => selectedColumns.includes(col.key)).map(col => {
                          // Buscar el dato dinámico correspondiente a esta persona y columna
                          const personDatum = allPersonData.find(
                            d => d.personId === person.id && d.dataTypeId === col.dataType.id
                          );
                          let displayValue = '-';
                          if (personDatum) {
                            if (col.dataType.type === 'image' || col.dataType.type === 'file') {
                              displayValue = personDatum.fileName && personDatum.fileName.trim() !== ''
                                ? personDatum.fileName
                                : (personDatum.value && personDatum.value.startsWith('data:') ? 'Archivo sin nombre' : '-');
                            } else {
                              displayValue = personDatum.value;
                            }
                          }
                          return (
                            <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {displayValue}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openEditModal(person)}
                            className="edit-btn text-indigo-600 hover:text-indigo-900 mr-3"
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => openDataManager(person)}
                            className="data-btn text-green-600 hover:text-green-900 mr-3"
                            title="Gestionar Datos"
                          >
                            <i className="fas fa-database"></i>
                          </button>
                          <button
                            onClick={() => deletePerson(person.id)}
                            className="delete-btn text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Empty state */}
              {people.length === 0 && (
                <div className="text-center py-12 px-4">
                  <i className="fas fa-user-slash text-4xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-500">Aún no hay personas agregadas</h3>
                  <p className="text-gray-400 mt-1">Haz clic en el botón "Agregar Persona" para comenzar</p>
                </div>
              )}
            </div>
            {/* Paginador */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 bg-white border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-2 md:mb-0">
                Mostrando {filteredPeople.length === 0 ? 0 : page * rowsPerPage + 1}
                -{Math.min((page + 1) * rowsPerPage, filteredPeople.length)} de {filteredPeople.length} personas
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(0)}
                  disabled={page === 0}
                  className="px-2 py-1 rounded border text-gray-700 disabled:opacity-50"
                  title="Primera página"
                >
                  &#171;
                </button>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-2 py-1 rounded border text-gray-700 disabled:opacity-50"
                  title="Página anterior"
                >
                  &#8249;
                </button>
                <span className="px-2">Página {totalPages === 0 ? 0 : page + 1} de {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-2 py-1 rounded border text-gray-700 disabled:opacity-50"
                  title="Página siguiente"
                >
                  &#8250;
                </button>
                <button
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                  className="px-2 py-1 rounded border text-gray-700 disabled:opacity-50"
                  title="Última página"
                >
                  &#187;
                </button>
                <select
                  value={rowsPerPage}
                  onChange={e => setRowsPerPage(Number(e.target.value))}
                  className="ml-2 border rounded px-2 py-1"
                  title="Filas por página"
                >
                  {[5, 10, 20, 50, 100].map(n => (
                    <option key={n} value={n}>{n} / pág.</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Add/Edit Person Modal */}
            {showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md modal-animation">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {editingPerson ? "Editar Persona" : "Agregar Nueva Persona"}
                      </h3>
                      <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <input type="hidden" name="id" value={formPerson.id} />
                      {/* Primera fila: Nombre y Email */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre Completo
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            id="fullName"
                            value={formPerson.fullName}
                            onChange={handleFormChange}
                            autoComplete="off"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              formErrors.fullName ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {formErrors.fullName && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email (opcional)
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formPerson.email}
                            onChange={handleFormChange}
                            autoComplete="off"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              formErrors.email ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {formErrors.email && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                          )}
                        </div>
                      </div>
                      {/* Segunda fila: Teléfono y Dirección */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono (opcional)
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formPerson.phone}
                            onChange={handleFormChange}
                            autoComplete="off"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              formErrors.phone ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {formErrors.phone && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                            Dirección
                          </label>
                          <input
                            type="text"
                            name="address"
                            id="address"
                            value={formPerson.address}
                            onChange={handleFormChange}
                            autoComplete="off"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      {/* Tercera fila: Fecha de Nacimiento y Género */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de Nacimiento
                          </label>
                          <input
                            type="date"
                            name="dateOfBirth"
                            id="dateOfBirth"
                            value={formPerson.dateOfBirth}
                            onChange={handleFormChange}
                            autoComplete="off"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              formErrors.dateOfBirth ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {formErrors.dateOfBirth && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.dateOfBirth}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                            Género
                          </label>
                          <select
                            name="gender"
                            id="gender"
                            value={formPerson.gender}
                            onChange={handleFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Seleccionar género</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                            <option value="Femenino">Neutro</option>
                          </select>
                        </div>
                      </div>
                      {/* Cuarta fila: Tipo de Documento y Número de Documento */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Documento
                          </label>
                          <select
                            name="documentType"
                            id="documentType"
                            value={formPerson.documentType}
                            onChange={handleFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Seleccionar tipo</option>
                            <option value="DNI">DNI</option>
                            <option value="Pasaporte">Pasaporte</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Documento
                          </label>
                          <input
                            type="text"
                            name="documentNumber"
                            id="documentNumber"
                            value={formPerson.documentNumber}
                            onChange={handleFormChange}
                            autoComplete="off"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      {/* Quinta fila: Checkbox Activo */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          name="isActive"
                          checked={formPerson.isActive || false}
                          onChange={handleFormChange}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                          Activo
                        </label>
                      </div>
                      {/* Sexta fila: Notas (ancho completo) */}
                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                          Notas
                        </label>
                        <textarea
                          name="notes"
                          id="notes"
                          value={formPerson.notes}
                          onChange={handleFormChange}
                          autoComplete="off"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows={2}
                        />
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                        >
                          Guardar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md modal-animation">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">Confirmar Eliminación</h3>
                      <button onClick={closeDeleteModal} className="text-gray-400 hover:text-gray-500">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <p className="text-gray-600 mb-6">
                      {deleteTarget === 'selected' 
                        ? `¿Estás seguro de que quieres eliminar ${selectedIds.size} ${selectedIds.size === 1 ? 'persona' : 'personas'} seleccionada${selectedIds.size === 1 ? '' : 's'}?`
                        : '¿Estás seguro de que quieres eliminar esta persona?'
                      }
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={closeDeleteModal}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Data Manager Modal */}
            {showDataManager && selectedPersonForData && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-5/6 modal-animation">
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Gestión de Datos Dinámicos - {selectedPersonForData.fullName}
                      </h3>
                      <button onClick={closeDataManager} className="text-gray-400 hover:text-gray-500">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <PersonDataManager 
                        personId={selectedPersonForData.id}
                        personName={selectedPersonForData.fullName}
                        onDataChanged={fetchAllPersonData}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
