import React, { useState, useMemo } from 'react';
import { UserCheck, PlusCircle, Search, Clock, Mail, PhoneCall, Calendar, History, ArrowUpRight, Users, X, Trash2, Plus, Building, User, HeartPulse, Edit2, FileText, Beaker } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestoreDb, LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';

const CLIENT_TYPES = [
    'Paciente (Clínico)',
    'Médico / Clínica',
    'Empresa de Alimentos',
    'Industria Farmacéutica (Humana)',
    'Industria Farmacéutica (Veterinaria)',
    'Sector Industrial General',
    'Hoteles',
    'Restaurantes',
    'Supermercados',
    'Compra de Insumos',
    'Otros'
];

const CONTACT_ROLES = ['General', 'Facturación', 'Reportes'];
const PHONE_TYPES = ['Celular', 'WhatsApp', 'Casa', 'Oficina', 'Emergencia', 'Otro'];

export const CRMView = ({ db = firestoreDb, clients = [], user, requests = [] }) => {
    const [selectedClient, setSelectedClient] = useState(null);
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCrmTab, setActiveCrmTab] = useState('Pacientes'); // 'Pacientes' | 'Empresas'
    const { addNotification } = useNotification();
    const [editingClientId, setEditingClientId] = useState(null);

    // Form states
    const [newClientType, setNewClientType] = useState(CLIENT_TYPES[2]);
    const [profileName, setProfileName] = useState('');
    const [profileDocument, setProfileDocument] = useState('');
    const [extraInfo, setExtraInfo] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('Masculino');
    const [simpleEmail, setSimpleEmail] = useState('');

    // Arrays for dynamic fields
    const [patientPhones, setPatientPhones] = useState([
        { id: Date.now(), number: '', type: 'Celular' }
    ]);

    const [contacts, setContacts] = useState([
        { id: Date.now(), name: '', email: '', phone: '', department: '', role: 'Facturación' }
    ]);

    const [isSaving, setIsSaving] = useState(false);

    // Filter combined clients based on search query
    const filteredClients = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const firestoreClients = (clients || []).map(c => ({
            id: c.id,
            name: c.name || '',
            type: c.type || 'N/A',
            document: c.document || '',
            contacts: c.contacts || [],
            status: c.status || 'Activo',
            ltv: c.ltv || 0,
            lastContact: c.lastContact || 'Justo ahora',
            createdAt: c.createdAt
        }));

        if (!query) {
            return firestoreClients.filter(c => 
                activeCrmTab === 'Pacientes' 
                    ? c.type.includes('Paciente') || c.type.includes('Médico')
                    : !c.type.includes('Paciente') && !c.type.includes('Médico')
            );
        }
        return firestoreClients.filter(c =>
            ((activeCrmTab === 'Pacientes' && (c.type.includes('Paciente') || c.type.includes('Médico'))) ||
            (activeCrmTab === 'Empresas' && !c.type.includes('Paciente') && !c.type.includes('Médico'))) &&
            (
                (c.name || '').toLowerCase().includes(query) ||
                (c.id || '').toLowerCase().includes(query) ||
                (c.contacts || []).some(contact => (contact.email || '').toLowerCase().includes(query) || (contact.name || '').toLowerCase().includes(query))
            )
        );
    }, [clients, searchQuery, activeCrmTab]);

    // Real History of Lab Requests
    const clientRequests = useMemo(() => {
        if (!selectedClient || !requests) return [];
        return requests.filter(r => (r.clientName || '').trim().toLowerCase() === (selectedClient.name || '').trim().toLowerCase());
    }, [selectedClient, requests]);

    const handleAddContact = () => {
        setContacts([...contacts, { id: Date.now(), name: '', email: '', phone: '', department: '', role: 'Reportes' }]);
    };

    const handleRemoveContact = (idToRemove) => {
        setContacts(contacts.filter(c => c.id !== idToRemove));
    };

    const handleContactChange = (id, field, value) => {
        setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    // Patient phones handlers
    const handleAddPatientPhone = () => {
        setPatientPhones([...patientPhones, { id: Date.now(), number: '', type: 'Celular' }]);
    };

    const handleRemovePatientPhone = (idToRemove) => {
        setPatientPhones(patientPhones.filter(p => p.id !== idToRemove));
    };

    const handlePatientPhoneChange = (id, field, value) => {
        setPatientPhones(patientPhones.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleBirthDateChange = (e) => {
        const val = e.target.value;
        if (val) {
            const selectedDate = new Date(val);
            const today = new Date();
            if (selectedDate > today) {
                addNotification("La fecha no puede ser futura. Se ha ajustado automáticamente.", "warning");
                setBirthDate(today.toISOString().split("T")[0]);
                return;
            }
            if (selectedDate.getFullYear() < 1900) {
                addNotification("Revise el año de nacimiento, parece ser inválido.", "warning");
            }
        }
        setBirthDate(val);
    };

    const handleEmailBlur = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.trim() && !emailRegex.test(email.trim())) {
            addNotification(`El correo electrónico ingresado no tiene un formato válido (@).`, "warning");
        }
    };

    const handleEditClient = () => {
        if (!selectedClient) return;
        setEditingClientId(selectedClient.id);

        let normalizedType = selectedClient.type || CLIENT_TYPES[2];
        if (normalizedType === 'paciente') normalizedType = 'Paciente (Clínico)';
        if (normalizedType === 'empresa') normalizedType = 'Empresa de Alimentos';
        if (!CLIENT_TYPES.includes(normalizedType)) normalizedType = CLIENT_TYPES[2];

        setNewClientType(normalizedType);
        setProfileName(selectedClient.name || '');
        setProfileDocument(selectedClient.document || '');
        setExtraInfo(selectedClient.extraInfo || '');
        setBirthDate(selectedClient.birthDate || '');
        setGender(selectedClient.gender || 'Masculino');

        const isClientPatient = normalizedType === 'Paciente (Clínico)' || normalizedType === 'Médico / Clínica';
        if (isClientPatient) {
            if (selectedClient.contacts && selectedClient.contacts.length > 0) {
                setSimpleEmail(selectedClient.contacts[0].email || '');
                if (selectedClient.contacts[0].phones && Array.isArray(selectedClient.contacts[0].phones)) {
                    setPatientPhones(selectedClient.contacts[0].phones.map((p, i) => ({ ...p, id: Date.now() + i })));
                } else if (selectedClient.contacts[0].phone) {
                    setPatientPhones([{ id: Date.now(), number: selectedClient.contacts[0].phone, type: 'General' }]);
                } else {
                    setPatientPhones([{ id: Date.now(), number: '', type: 'Celular' }]);
                }
            } else {
                setSimpleEmail('');
                setPatientPhones([{ id: Date.now(), number: '', type: 'Celular' }]);
            }
            setContacts([{ id: Date.now(), name: '', email: '', phone: '', department: '', role: 'Facturación' }]);
        } else {
            setSimpleEmail('');
            setPatientPhones([{ id: Date.now(), number: '', type: 'Celular' }]);
            if (selectedClient.contacts && selectedClient.contacts.length > 0) {
                setContacts(selectedClient.contacts.map((c, i) => ({ ...c, id: Date.now() + i })));
            } else {
                setContacts([{ id: Date.now(), name: '', email: '', phone: '', department: '', role: 'Facturación' }]);
            }
        }
        setShowNewClientModal(true);
    };

    const handleDeleteClient = async (client = selectedClient) => {
        if (!client) return;

        if (window.confirm(`¿Está seguro de eliminar a ${client.name}? Esta acción no se puede deshacer y el perfil desaparecerá del directorio.`)) {
            try {
                await deleteDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/clients`, client.id));
                await logAuditAction(db, user?.uid, 'ELIMINAR_CLIENTE_CRM', `Perfil eliminado: ${client.name}`, client.id);
                addNotification("Perfil eliminado exitosamente.", "success");
                if (selectedClient?.id === client.id) {
                    setSelectedClient(null);
                }
            } catch (error) {
                console.error("Error al eliminar cliente:", error);
                addNotification("Ocurrió un error al eliminar el perfil.", "error");
            }
        }
    };

    const handleSaveClient = async (e) => {
        e.preventDefault();
        if (!db) {
            addNotification("Base de datos no disponible.", "error");
            return;
        }

        const name = profileName.trim();
        if (!name) {
            addNotification("El nombre o razón social es obligatorio.", "warning");
            return;
        }

        const isDuplicate = clients.some(c =>
            c.id !== editingClientId &&
            (
                c.name.toLowerCase() === name.toLowerCase() ||
                (profileDocument.trim() !== '' && c.document === profileDocument.trim())
            )
        );

        if (isDuplicate) {
            addNotification("Ya existe un cliente con este nombre o identificación.", "warning");
            return;
        }

        // Data format validations
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (newClientType === 'Paciente (Clínico)' || newClientType === 'Médico / Clínica') {
            if (simpleEmail.trim() && !emailRegex.test(simpleEmail.trim())) {
                addNotification("El correo electrónico del paciente no tiene un formato válido.", "warning");
                return;
            }
            if (birthDate) {
                const selectedDate = new Date(birthDate);
                const today = new Date();
                if (selectedDate > today) {
                    addNotification("La fecha de nacimiento no puede ser en el futuro.", "warning");
                    return;
                }
            }
        } else {
            const hasInvalidEmail = contacts.some(c => c.email.trim() && !emailRegex.test(c.email.trim()));
            if (hasInvalidEmail) {
                addNotification("Uno de los contactos tiene un correo electrónico inválido.", "warning");
                return;
            }
        }

        setIsSaving(true);
        try {
            let cleanContacts = [];

            if (newClientType === 'Paciente (Clínico)' || newClientType === 'Médico / Clínica') {
                const mainContact = {
                    name: name,
                    email: simpleEmail.trim(),
                    phones: patientPhones.filter(p => p.number.trim() !== '').map(p => ({ number: p.number.trim(), type: p.type })),
                    department: '',
                    role: 'General'
                };
                const validMain = (mainContact.email || (mainContact.phones && mainContact.phones.length > 0)) ? [mainContact] : [{ name, email: '', phones: [], department: '', role: 'General' }];

                const additional = contacts.filter(c => c.name.trim() !== '').map(c => ({
                    name: c.name.trim(),
                    email: c.email.trim(),
                    phone: c.phone.trim(),
                    department: c.department.trim(),
                    role: c.role
                }));

                cleanContacts = [...validMain, ...additional];
            } else {
                cleanContacts = contacts.map(c => ({
                    name: c.name.trim(),
                    email: c.email.trim(),
                    phone: c.phone.trim(),
                    department: c.department.trim(),
                    role: c.role
                })).filter(c => c.name || c.email || c.phone);
            }

            const clientPayload = {
                name,
                document: profileDocument.trim(),
                type: newClientType,
                extraInfo: extraInfo.trim(),
                birthDate: (newClientType === 'Paciente (Clínico)') ? birthDate : '',
                gender: (newClientType === 'Paciente (Clínico)') ? gender : '',
                contacts: cleanContacts,
                status: 'Activo',
                ltv: 0,
                lastContact: 'Justo ahora',
            };

            if (editingClientId) {
                const docRef = doc(db, `artifacts/${LIMSSystemId}/public/data/clients`, editingClientId);
                await updateDoc(docRef, { ...clientPayload, updatedAt: serverTimestamp() });
                await logAuditAction(db, user?.uid, 'EDITAR_CLIENTE_CRM', `Perfil editado: ${name}`, editingClientId);
                addNotification("Perfil actualizado exitosamente.", "success");

                setSelectedClient(prev => ({ ...prev, ...clientPayload, id: editingClientId }));
            } else {
                clientPayload.createdAt = serverTimestamp();
                const docRef = await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/clients`), clientPayload);
                await logAuditAction(db, user?.uid, 'REGISTRAR_CLIENTE_CRM', `Perfil creado: ${name} (${newClientType}) con ${cleanContacts.length} contactos.`, docRef.id);
                addNotification("Perfil registrado exitosamente.", "success");
            }

            // Clean form states
            setProfileName('');
            setProfileDocument('');
            setExtraInfo('');
            setBirthDate('');
            setGender('Masculino');
            setSimpleEmail('');
            setPatientPhones([{ id: Date.now(), number: '', type: 'Celular' }]);
            setContacts([{ id: Date.now(), name: '', email: '', phone: '', department: '', role: 'Facturación' }]);

            setShowNewClientModal(false);
        } catch (error) {
            console.error("Error al registrar cliente en CRM:", error);
            addNotification("Ocurrió un error al guardar el perfil.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const getMainContactInfo = (contactsList) => {
        if (!contactsList || contactsList.length === 0) return { email: 'Sin contactos', phone: '' };
        const generalOrBilling = contactsList.find(c => c.role === 'Facturación' || c.role === 'General') || contactsList[0];

        let primaryPhone = '';
        if (generalOrBilling.phones && generalOrBilling.phones.length > 0) {
            primaryPhone = generalOrBilling.phones[0].number;
        } else if (generalOrBilling.phone) {
            primaryPhone = generalOrBilling.phone;
        }

        return { email: generalOrBilling.email || 'Sin correo', phone: primaryPhone };
    };

    const renderExternalResults = (mdText) => {
        if (!mdText) return null;
        const lines = mdText.split('\n');
        let inTable = false;
        let headers = [];
        const elements = [];
        let tableRows = [];

        const flushTable = (idx) => {
            if (inTable && tableRows.length > 0) {
                elements.push(
                    <div key={`ext-table-wrap-${idx}`} className="w-full overflow-x-auto my-3">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead className="bg-white border-b border-slate-200">
                                <tr>
                                    {headers.map((h, i) => <th key={i} className="py-2 px-3 text-xs font-bold text-slate-600 border border-slate-200">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map((row, rIdx) => (
                                    <tr key={rIdx} className={`border-b border-slate-100 ${rIdx % 2 !== 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
                                        {row.map((cell, cIdx) => {
                                            let cellClass = "py-2 px-3 text-xs border border-slate-100 text-slate-600";
                                            if (cell.includes('🔴')) cellClass += " text-red-600 font-bold bg-red-50/30";
                                            else if (cell.includes('⚠️')) cellClass += " text-amber-600 font-bold bg-amber-50/30";
                                            else if (cell.includes('🟢')) cellClass += " text-emerald-600 font-medium";
                                            if (cIdx === 1) cellClass += " font-black text-center";
                                            return (
                                                <td key={cIdx} className={cellClass}>
                                                    {cell}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            inTable = false;
            headers = [];
            tableRows = [];
        };

        lines.forEach((line, idx) => {
            if (line.trim().startsWith('|')) {
                const cells = line.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
                if (!inTable) {
                    if (cells[0].includes('---')) return;
                    inTable = true;
                    headers = cells;
                } else if (line.includes('---')) {
                    // separator
                } else {
                    tableRows.push(cells);
                }
            } else {
                flushTable(idx);
                if (line.trim().startsWith('##')) {
                    elements.push(<h4 key={`ext-h-${idx}`} className="font-bold text-slate-700 mt-4 mb-2 text-sm border-b border-slate-200 pb-1">{line.replace(/#/g, '').trim()}</h4>);
                } else if (line.trim().startsWith('---')) {
                    // ignore
                } else if (line.trim() !== '') {
                    elements.push(<p key={`ext-p-${idx}`} className="text-xs text-slate-600 mb-1">{line}</p>);
                }
            }
        });

        flushTable('end');
        return <div>{elements}</div>;
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        {activeCrmTab === 'Pacientes' ? <HeartPulse className="text-indigo-600" /> : <Building className="text-slate-800" />}
                        {activeCrmTab === 'Pacientes' ? 'Directorio de Pacientes y Clínicas' : 'Directorio de Empresas Corporativas'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Gestión de relaciones, historial clínico y datos de contacto 360°.</p>
                </div>
                
                <div className="flex bg-slate-200/60 p-1 rounded-xl w-max">
                    <button onClick={() => { setActiveCrmTab('Pacientes'); setSelectedClient(null); }} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeCrmTab === 'Pacientes' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>🏥 Pacientes</button>
                    <button onClick={() => { setActiveCrmTab('Empresas'); setSelectedClient(null); }} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeCrmTab === 'Empresas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>🏭 Empresas</button>
                </div>

                <button
                    onClick={() => {
                        setEditingClientId(null);
                        setProfileName('');
                        setProfileDocument('');
                        setExtraInfo('');
                        setBirthDate('');
                        setGender('Masculino');
                        setSimpleEmail('');
                        setPatientPhones([{ id: Date.now(), number: '', type: 'Celular' }]);
                        setNewClientType(activeCrmTab === 'Pacientes' ? CLIENT_TYPES[0] : CLIENT_TYPES[2]); 
                        setContacts([{ id: Date.now(), name: '', email: '', phone: '', department: '', role: 'Facturación' }]);
                        setShowNewClientModal(true);
                    }}
                    className={`text-white px-4 py-2 rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer ${activeCrmTab === 'Pacientes' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-800 hover:bg-slate-900'}`}
                >
                    <PlusCircle size={18} /> {activeCrmTab === 'Pacientes' ? 'Nuevo Paciente' : 'Nueva Empresa'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Directorio */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar empresa o contacto..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredClients.map(c => {
                            const mainContact = getMainContactInfo(c.contacts);
                            return (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedClient(c)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border relative group ${selectedClient?.id === c.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-slate-800 text-sm pr-6">{c.name}</h4>
                                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${c.status === 'Activo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-1 line-clamp-1">{c.type}</p>
                                    <p className="text-xs text-slate-400 mb-2 truncate">{mainContact.email}</p>
                                    
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteClient(c); }} 
                                        className="absolute top-3 right-8 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white/80 rounded-md shadow-sm"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                        {filteredClients.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm italic">
                                No se encontraron clientes.
                            </div>
                        )}
                    </div>
                </div>

                {/* Perfil 360 */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    {selectedClient ? (
                        <>
                            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">{selectedClient.type}</span>
                                        {selectedClient.document && <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">ID: {selectedClient.document}</span>}
                                        {selectedClient.birthDate && <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">Nac: {selectedClient.birthDate.split('-').reverse().join('/')}</span>}
                                        {selectedClient.gender && <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">Sexo: {selectedClient.gender}</span>}
                                    </div>
                                    <h3 className="text-xl font-extrabold text-slate-800">{selectedClient.name}</h3>
                                    {selectedClient.extraInfo && <p className="text-sm text-slate-500 mt-1">{selectedClient.extraInfo}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleEditClient} className="bg-white border border-slate-200 text-slate-700 p-2 rounded-lg hover:bg-slate-50 transition-colors" title="Editar Perfil"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDeleteClient(selectedClient)} className="bg-white border border-red-200 text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Eliminar Perfil"><Trash2 size={18} /></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">

                                {/* Libreta de Contactos */}
                                <div className="mb-8">
                                    {(selectedClient.type === 'Paciente (Clínico)' || selectedClient.type === 'Médico / Clínica' || selectedClient.type === 'paciente') ? (
                                        <>
                                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PhoneCall size={18} className="text-indigo-500" /> Datos de Contacto Directo</h4>
                                            {selectedClient.contacts && selectedClient.contacts.length > 0 ? (
                                                <div className="space-y-3 text-sm text-slate-600 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                                    {selectedClient.contacts[0].email && <p className="flex items-center gap-2"><Mail size={16} className="text-slate-400" /> <span className="font-medium text-slate-700">{selectedClient.contacts[0].email}</span></p>}
                                                    {selectedClient.contacts[0].phones && selectedClient.contacts[0].phones.length > 0 ? (
                                                        selectedClient.contacts[0].phones.map((p, pIdx) => (
                                                            <p key={pIdx} className="flex items-center gap-2">
                                                                <PhoneCall size={16} className="text-slate-400" />
                                                                <span className="font-medium text-slate-700">{p.number}</span>
                                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">{p.type}</span>
                                                            </p>
                                                        ))
                                                    ) : selectedClient.contacts[0].phone ? (
                                                        <p className="flex items-center gap-2"><PhoneCall size={16} className="text-slate-400" /> <span className="font-medium text-slate-700">{selectedClient.contacts[0].phone}</span></p>
                                                    ) : null}
                                                    {(!selectedClient.contacts[0].email && (!selectedClient.contacts[0].phones || selectedClient.contacts[0].phones.length === 0) && !selectedClient.contacts[0].phone) && (
                                                        <p className="text-slate-400 italic">No hay datos de contacto directo registrados.</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-slate-400 italic text-sm">No hay datos registrados.</p>
                                            )}

                                            {selectedClient.contacts && selectedClient.contacts.length > 1 && (
                                                <div className="mt-6">
                                                    <h5 className="font-bold text-slate-700 text-sm mb-3 border-b border-slate-100 pb-2">Contactos Adicionales (Familiares / Emergencia)</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {selectedClient.contacts.slice(1).map((contact, idx) => (
                                                            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <h5 className="font-bold text-slate-800 text-sm">{contact.name}</h5>
                                                                        {contact.department && <p className="text-xs text-slate-500">{contact.department}</p>}
                                                                    </div>
                                                                    <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                                                        {contact.role}
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-2 text-sm text-slate-600 mt-3">
                                                                    {contact.email && <p className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {contact.email}</p>}
                                                                    {contact.phone && <p className="flex items-center gap-2"><PhoneCall size={14} className="text-slate-400" /> {contact.phone}</p>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={18} className="text-indigo-500" /> Directorio de Contactos</h4>

                                            {selectedClient.contacts && selectedClient.contacts.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {selectedClient.contacts.map((contact, idx) => (
                                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <h5 className="font-bold text-slate-800 text-sm">{contact.name || 'Contacto Principal'}</h5>
                                                                    {contact.department && <p className="text-xs text-slate-500">{contact.department}</p>}
                                                                </div>
                                                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${contact.role === 'Facturación' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                        contact.role === 'Reportes' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                                            'bg-slate-100 text-slate-600 border border-slate-200'
                                                                    }`}>
                                                                    {contact.role}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2 text-sm text-slate-600 mt-3">
                                                                {contact.email && <p className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {contact.email}</p>}

                                                                {contact.phones && contact.phones.length > 0 ? (
                                                                    contact.phones.map((p, pIdx) => (
                                                                        <p key={pIdx} className="flex items-center gap-2">
                                                                            <PhoneCall size={14} className="text-slate-400" />
                                                                            <span className="font-medium">{p.number}</span>
                                                                            <span className="text-xs text-slate-400">({p.type})</span>
                                                                        </p>
                                                                    ))
                                                                ) : contact.phone ? (
                                                                    <p className="flex items-center gap-2"><PhoneCall size={14} className="text-slate-400" /> {contact.phone}</p>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-slate-100 rounded-xl text-sm text-slate-500 italic">No hay contactos registrados para esta empresa.</div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Historial de Solicitudes Reales */}
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><History size={18} className="text-slate-500" /> Historial de Órdenes de Laboratorio</h4>

                                    {clientRequests.length > 0 ? (
                                        <div className="space-y-4">
                                            {clientRequests.map((req) => (
                                                <div key={req.id} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm border border-indigo-200">
                                                            <FileText size={14} />
                                                        </div>
                                                        <div className="w-px h-full bg-slate-200 my-1"></div>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1 mb-2">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h5 className="font-bold text-slate-800 text-sm">{req.id}</h5>
                                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{req.status}</span>
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-600 mt-1 mb-2">{req.analysisRequested}</p>
                                                        <div className="flex gap-4 text-xs text-slate-500">
                                                            {req.requestDate?.seconds && (
                                                                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(req.requestDate.seconds * 1000).toLocaleDateString()}</span>
                                                            )}
                                                            {req.sampleType && (
                                                                <span className="flex items-center gap-1"><Beaker size={12} /> {req.sampleType}</span>
                                                            )}
                                                        </div>
                                                        {req.isReferred && req.referralResults && (
                                                            <details className="mt-4 bg-indigo-50/30 border border-indigo-100 rounded-lg p-3 group transition-all">
                                                                <summary className="text-xs font-bold text-indigo-700 cursor-pointer flex items-center gap-2 outline-none">
                                                                    <span className="group-open:hidden">▶ Ver Resultados Extraídos (IA)</span>
                                                                    <span className="hidden group-open:inline">▼ Ocultar Resultados</span>
                                                                </summary>
                                                                <div className="mt-3 text-xs overflow-x-auto">
                                                                    {renderExternalResults(req.referralResults)}
                                                                </div>
                                                            </details>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex gap-4 opacity-50">
                                                <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                                                    <ArrowUpRight size={14} />
                                                </div>
                                                <div className="flex-1 flex items-center text-sm font-medium text-slate-400">Fin del historial</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 border-dashed">
                                            <p className="text-slate-500 text-sm">Este cliente no tiene órdenes de laboratorio registradas aún.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 h-full">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mb-4">
                                <Users size={40} />
                            </div>
                            <h4 className="font-bold text-slate-500 text-lg">Seleccione un perfil</h4>
                            <p className="text-sm text-slate-400 mt-2 max-w-sm">Haga clic en un paciente o empresa del directorio para visualizar su expediente, contactos y el historial real de órdenes generadas.</p>
                        </div>
                    )}
                </div>
            </div>

            {showNewClientModal && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fade-in flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="text-xl font-bold text-slate-800">{editingClientId ? 'Editar Expediente' : 'Registrar Nuevo Perfil'}</h3>
                            <button onClick={() => setShowNewClientModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveClient} className="flex-1 overflow-y-auto flex flex-col">
                            <div className="p-6 space-y-8 flex-1">

                                {/* Información Principal */}
                                <section>
                                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Información Principal</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre o Razón Social *</label>
                                            <input required type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700" placeholder="Ej. Juan Pérez / Empresa S.A." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Categoría / Sector *</label>
                                            <select
                                                value={newClientType}
                                                onChange={(e) => setNewClientType(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 cursor-pointer"
                                            >
                                                {CLIENT_TYPES.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">NIT / Cédula / Identificación</label>
                                            <input type="text" value={profileDocument} onChange={e => setProfileDocument(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700" placeholder="Ej. 1-1234-5678" />
                                        </div>

                                        {(newClientType === 'Paciente (Clínico)' || newClientType === 'Médico / Clínica') && (
                                            <>
                                                {newClientType === 'Paciente (Clínico)' && (
                                                    <>
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
                                                            <input type="date" max={new Date().toISOString().split("T")[0]} value={birthDate} onChange={handleBirthDateChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-1">Género</label>
                                                            <select value={gender} onChange={e => setGender(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 cursor-pointer">
                                                                <option value="Masculino">Masculino</option>
                                                                <option value="Femenino">Femenino</option>
                                                                <option value="Otro">Otro</option>
                                                                <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                                                            </select>
                                                        </div>
                                                    </>
                                                )}
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Información Médica Adicional (Opcional)</label>
                                                    <input type="text" value={extraInfo} onChange={e => setExtraInfo(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700" placeholder="Ej. Médico Tratante, Especialidad, Código..." />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </section>

                                {/* Contactos Diferenciados por Tipo */}
                                {(newClientType === 'Paciente (Clínico)' || newClientType === 'Médico / Clínica') ? (
                                    <section>
                                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                            <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Datos de Contacto</h4>
                                            <button
                                                type="button"
                                                onClick={handleAddPatientPhone}
                                                className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                            >
                                                <Plus size={14} /> Añadir Teléfono
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="w-full md:w-1/2">
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico Principal</label>
                                                <input type="email" value={simpleEmail} onChange={e => setSimpleEmail(e.target.value)} onBlur={e => handleEmailBlur(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700" placeholder="correo@ejemplo.com" />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Números de Teléfono Directos</label>
                                                {patientPhones.map((phone, _idx) => (
                                                    <div key={phone.id} className="flex gap-2 items-center">
                                                        <select
                                                            value={phone.type}
                                                            onChange={e => handlePatientPhoneChange(phone.id, 'type', e.target.value)}
                                                            className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium w-36"
                                                        >
                                                            {PHONE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                        <input
                                                            type="text"
                                                            value={phone.number}
                                                            onChange={e => handlePatientPhoneChange(phone.id, 'number', e.target.value)}
                                                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                                                            placeholder="Ej. 8888-9999"
                                                        />
                                                        {patientPhones.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemovePatientPhone(phone.id)}
                                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Contactos Adicionales */}
                                        <div className="mt-8 border-t border-slate-100 pt-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Contactos Adicionales (Familiar / Emergencia)</h4>
                                                <button
                                                    type="button"
                                                    onClick={handleAddContact}
                                                    className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                                >
                                                    <Plus size={14} /> Añadir Persona
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {contacts.map((contact, _index) => (
                                                    <div key={contact.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
                                                        <div className="absolute top-2 right-2 flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveContact(contact.id)}
                                                                className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                                                                title="Eliminar contacto"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pr-8">
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre</label>
                                                                <input type="text" value={contact.name} onChange={e => handleContactChange(contact.id, 'name', e.target.value)} className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded outline-none focus:border-indigo-500" placeholder="Ej. Ana Pérez" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-1">Parentesco / Relación</label>
                                                                <input type="text" value={contact.department} onChange={e => handleContactChange(contact.id, 'department', e.target.value)} className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded outline-none focus:border-indigo-500" placeholder="Ej. Madre / Médico Tratante" />
                                                            </div>
                                                            <div className="hidden">
                                                                <select value={contact.role} onChange={e => handleContactChange(contact.id, 'role', e.target.value)}>
                                                                    <option value="General">General</option>
                                                                </select>
                                                            </div>
                                                            <div className="xl:col-span-1 md:col-span-1">
                                                                <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono</label>
                                                                <input type="text" value={contact.phone} onChange={e => handleContactChange(contact.id, 'phone', e.target.value)} className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded outline-none focus:border-indigo-500" placeholder="Ej. 2233-4455" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {contacts.length === 0 && (
                                                    <p className="text-xs text-slate-400 italic">No hay contactos adicionales. Presione 'Añadir Persona' si necesita registrar un familiar o contacto de emergencia.</p>
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                ) : (
                                    <section>
                                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                            <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Libreta de Contactos Múltiples</h4>
                                            <button
                                                type="button"
                                                onClick={handleAddContact}
                                                className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                            >
                                                <Plus size={14} /> Añadir Persona
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {contacts.map((contact, _index) => (
                                                <div key={contact.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
                                                    <div className="absolute top-2 right-2 flex gap-2">
                                                        {contacts.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveContact(contact.id)}
                                                                className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                                                                title="Eliminar contacto"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pr-8">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 mb-1">Nombre de la Persona</label>
                                                            <input type="text" value={contact.name} onChange={e => handleContactChange(contact.id, 'name', e.target.value)} className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded outline-none focus:border-indigo-500" placeholder="Ej. Ana G." />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 mb-1">Depto / Puesto</label>
                                                            <input type="text" value={contact.department} onChange={e => handleContactChange(contact.id, 'department', e.target.value)} className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded outline-none focus:border-indigo-500" placeholder="Ej. Compras o Calidad" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 mb-1">Recibe Documentos De:</label>
                                                            <select value={contact.role} onChange={e => handleContactChange(contact.id, 'role', e.target.value)} className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded outline-none focus:border-indigo-500 cursor-pointer">
                                                                {CONTACT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="xl:col-span-1 md:col-span-2">
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                                                                <input type="email" value={contact.email} onChange={e => handleContactChange(contact.id, 'email', e.target.value)} onBlur={e => handleEmailBlur(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium text-slate-700" placeholder="correo@ejemplo.com" />
                                                            </div>
                                                        </div>
                                                        <div className="xl:col-span-2 md:col-span-2">
                                                            <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono Directo</label>
                                                            <input type="text" value={contact.phone} onChange={e => handleContactChange(contact.id, 'phone', e.target.value)} className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded outline-none focus:border-indigo-500" placeholder="Ej. 2233-4455" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">Agregue múltiples contactos para que el sistema sepa a quién enviarle automáticamente las facturas y a quién los reportes de resultados.</p>
                                    </section>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
                                <button type="button" onClick={() => setShowNewClientModal(false)} className="px-6 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 border border-transparent hover:bg-slate-200 cursor-pointer transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="px-6 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer disabled:opacity-50 transition-colors">
                                    {isSaving ? 'Guardando...' : (editingClientId ? 'Guardar Cambios' : 'Guardar Expediente')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
