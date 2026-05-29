import React, { useState, useRef } from 'react';
import { MapPin, Camera, Upload, CheckCircle2, Navigation, FileSignature, ThermometerSun, AlertCircle, Save } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, LIMSSystemId } from '../services/firebase';
import { useNotification } from '../contexts/NotificationContext';

export const FieldSamplingView = ({ user }) => {
    const { addNotification } = useNotification();
    const [isLocating, setIsLocating] = useState(false);
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        client: '',
        samplePoint: '',
        matrix: 'Agua Potable',
        temperature: '',
        chlorine: '',
        ph: '',
        observations: '',
        collectorName: user?.nombre || 'Recolector'
    });

    const clients = [
        "Acueductos del Valle", "Planta Procesadora Sur", "Hotel Costa Azul", "Residencial Las Lomas", "Municipalidad Central"
    ];

    const matrices = [
        "Agua Potable", "Agua Residual", "Agua de Pozo", "Alimento Preparado", "Superficie Viva", "Superficie Inerte", "Suelo"
    ];

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const captureLocation = () => {
        setIsLocating(true);
        setLocationError('');
        if (!navigator.geolocation) {
            setLocationError('Geolocalización no soportada por el navegador.');
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
                setIsLocating(false);
            },
            (error) => {
                setLocationError('No se pudo obtener la ubicación. ' + error.message);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.client || !formData.samplePoint) {
            addNotification('error', 'Faltan datos obligatorios (Cliente y Punto de Muestreo).');
            return;
        }

        setIsSaving(true);
        try {
            const samplingData = {
                ...formData,
                location: location ? { lat: location.lat, lng: location.lng } : null,
                hasPhoto: !!photoPreview,
                status: 'collected',
                timestamp: serverTimestamp(),
                systemId: LIMSSystemId
            };

            // En un caso real, la foto iría a Firebase Storage. Aquí guardamos la bandera o base64 pequeño.
            // Para evitar exceder límite de Firestore con Base64 grandes, solo registramos que hay foto.

            const samplesRef = collection(db, 'field_samples');
            await addDoc(samplesRef, samplingData);

            addNotification('success', 'Muestra registrada y sincronizada correctamente.');
            
            // Reset form
            setFormData({
                ...formData,
                samplePoint: '',
                temperature: '',
                chlorine: '',
                ph: '',
                observations: ''
            });
            setLocation(null);
            setPhotoPreview(null);
        } catch (error) {
            console.error("Error saving sample:", error);
            addNotification('error', 'Error al sincronizar la muestra.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12 max-w-3xl mx-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                    <Navigation className="text-emerald-600" /> App de Muestreo en Campo
                </h2>
                <p className="text-slate-500 text-sm">Registre muestras in-situ con geolocalización, parámetros de campo y cadena de custodia remota.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-emerald-600 p-4 text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <MapPin size={20} /> Datos de Recolección
                    </h3>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* General Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Cliente / Proyecto *</label>
                            <select 
                                name="client" value={formData.client} onChange={handleInputChange} required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="">Seleccione un cliente...</option>
                                {clients.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Matriz de Muestra *</label>
                            <select 
                                name="matrix" value={formData.matrix} onChange={handleInputChange} required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                {matrices.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Punto de Muestreo (Identificación) *</label>
                            <input 
                                type="text" name="samplePoint" value={formData.samplePoint} onChange={handleInputChange} required
                                placeholder="Ej. Grifo cocina, Pozo 1, Lote 45B..."
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Mediciones In Situ */}
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-4">
                        <h4 className="font-bold text-orange-800 flex items-center gap-2 text-sm">
                            <ThermometerSun size={16} /> Parámetros In Situ (Opcional)
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-orange-700 mb-1">Temp (°C)</label>
                                <input 
                                    type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm bg-white" placeholder="Ej. 24.5"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-orange-700 mb-1">pH</label>
                                <input 
                                    type="number" step="0.01" name="ph" value={formData.ph} onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm bg-white" placeholder="Ej. 7.2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-orange-700 mb-1">Cloro (mg/L)</label>
                                <input 
                                    type="number" step="0.01" name="chlorine" value={formData.chlorine} onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm bg-white" placeholder="Ej. 0.5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Geolocation & Camera */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Geo */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">Geolocalización</label>
                            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50 flex flex-col items-center justify-center min-h-[120px]">
                                {location ? (
                                    <div className="text-emerald-600 flex flex-col items-center">
                                        <CheckCircle2 size={32} className="mb-2" />
                                        <span className="font-bold text-sm">Ubicación Capturada</span>
                                        <span className="text-xs font-mono mt-1">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
                                        <button type="button" onClick={captureLocation} className="text-xs underline mt-2 text-slate-500">Actualizar</button>
                                    </div>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={captureLocation}
                                        disabled={isLocating}
                                        className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        <MapPin size={16} /> {isLocating ? 'Obteniendo GPS...' : 'Capturar GPS Actual'}
                                    </button>
                                )}
                                {locationError && <p className="text-red-500 text-xs mt-2">{locationError}</p>}
                            </div>
                        </div>

                        {/* Photo */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">Evidencia Fotográfica</label>
                            <div 
                                className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50 flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment"
                                    ref={fileInputRef}
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                />
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                ) : (
                                    <>
                                        <Camera size={32} className="text-slate-400 mb-2" />
                                        <span className="font-bold text-sm text-slate-600">Tomar Foto / Subir</span>
                                        <span className="text-xs text-slate-400 mt-1">Soporta cámara del móvil</span>
                                    </>
                                )}
                                {photoPreview && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                        <span className="text-white font-bold text-sm bg-black bg-opacity-50 px-3 py-1 rounded-lg">Cambiar Foto</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Observaciones In Situ</label>
                        <textarea 
                            name="observations" value={formData.observations} onChange={handleInputChange}
                            rows="2"
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                            placeholder="Condiciones del clima, estado del grifo, color anómalo..."
                        ></textarea>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <FileSignature size={16} /> Recolector: <strong className="text-slate-800">{formData.collectorName}</strong>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-3 rounded-xl font-extrabold hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Save size={20} /> {isSaving ? 'Sincronizando...' : 'Registrar Muestra'}
                    </button>
                </div>
            </form>
        </div>
    );
};
