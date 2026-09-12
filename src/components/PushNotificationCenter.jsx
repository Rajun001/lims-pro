import React, { useState, useEffect } from 'react';
import { 
    Bell, CheckCircle2, AlertTriangle, Send, ShieldCheck, 
    RefreshCw, Zap, Smartphone, Sliders, Clock, Info
} from 'lucide-react';
import NotificationService, { PUSH_TOPICS } from '../services/NotificationService';

export default function PushNotificationCenter() {
    const [isSupported, setIsSupported] = useState(true);
    const [permission, setPermission] = useState('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [activeTopics, setActiveTopics] = useState(() => {
        const saved = localStorage.getItem('LIMS_PUSH_TOPICS');
        return saved ? JSON.parse(saved) : Object.keys(PUSH_TOPICS);
    });
    const [pushLogs, setPushLogs] = useState([]);
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [selectedTestTopic, setSelectedTestTopic] = useState('VALOR_CRITICO');

    useEffect(() => {
        setIsSupported(NotificationService.isPushSupported());
        setPermission(NotificationService.getPushPermission());
        setIsSubscribed(localStorage.getItem('LIMS_PUSH_SUBSCRIBED') === 'true');
        loadLogs();
    }, []);

    useEffect(() => {
        localStorage.setItem('LIMS_PUSH_TOPICS', JSON.stringify(activeTopics));
    }, [activeTopics]);

    const loadLogs = () => {
        try {
            const logs = JSON.parse(localStorage.getItem('LIMS_PUSH_LOGS') || '[]');
            setPushLogs(logs);
        } catch {
            setPushLogs([]);
        }
    };

    const handleToggleTopic = (topicKey) => {
        setActiveTopics(prev => 
            prev.includes(topicKey) ? prev.filter(k => k !== topicKey) : [...prev, topicKey]
        );
    };

    const handleSubscribe = async () => {
        try {
            await NotificationService.subscribeToPush();
            setPermission(NotificationService.getPushPermission());
            setIsSubscribed(true);
        } catch (e) {
            alert(e.message);
        }
    };

    const handleUnsubscribe = async () => {
        await NotificationService.unsubscribeFromPush();
        setIsSubscribed(false);
    };

    const handleSendTestPush = async () => {
        setIsSendingTest(true);
        const topic = PUSH_TOPICS[selectedTestTopic] || PUSH_TOPICS.VALOR_CRITICO;
        
        let testMsg = {
            title: `🚨 Alerta LIMS: ${topic.label}`,
            body: `Muestra M-2026-8812 con glucosa crítica (450 mg/dL). Notificación en tiempo real auditada.`,
            tag: topic.id
        };

        if (selectedTestTopic === 'RESULTADO_LISTO') {
            testMsg = {
                title: '🧪 Resultados Disponibles',
                body: 'La orden OS-1042 (Dos Pinos R.L.) ha sido aprobada por Dirección Técnica.',
                tag: 'RESULTADO_LISTO'
            };
        } else if (selectedTestTopic === 'CADENA_FRIO') {
            testMsg = {
                title: '❄️ Ruptura de Cadena de Frío',
                body: 'Freezer -20°C (Sensor B4) ha superado el umbral máximo (-13.5°C).',
                tag: 'CADENA_FRIO'
            };
        }

        await NotificationService.sendPushToSelf(testMsg);
        loadLogs();
        setTimeout(() => setIsSendingTest(false), 500);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header del Módulo Push */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full backdrop-blur-xs border border-white/20">
                            Web Push API · VAPID
                        </span>
                        <span className="text-xs text-purple-200 font-bold">Canal PWA de Alertas Inmediatas</span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">Centro de Notificaciones Push</h3>
                    <p className="text-purple-100 text-xs max-w-xl">
                        Recepción de alertas críticas, resultados validados y eventos de laboratorio directamente en el navegador y dispositivo móvil.
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0 min-w-[200px]">
                    <span className="text-[10px] font-bold text-purple-200 uppercase tracking-widest block">Estado del Dispositivo</span>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span className={`w-3 h-3 rounded-full ${isSubscribed ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                        <span className="text-sm font-black text-white">
                            {isSubscribed ? 'Suscrito & Activo' : 'No Suscrito'}
                        </span>
                    </div>
                    <span className="text-[10px] text-purple-200 block mt-0.5">Permiso: {permission}</span>
                </div>
            </div>

            {/* Panel de Suscripción & Configuración */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Columna 1: Acciones de Suscripción */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Smartphone size={16} className="text-indigo-600" /> Permiso del Navegador
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Para recibir alertas aunque la pestaña no esté visible, habilite las notificaciones del navegador.
                    </p>

                    <div className="pt-2">
                        {!isSubscribed ? (
                            <button
                                onClick={handleSubscribe}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <Bell size={16} /> Activar Notificaciones Push
                            </button>
                        ) : (
                            <button
                                onClick={handleUnsubscribe}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                                Desactivar Notificaciones
                            </button>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Disparar Notificación de Prueba</span>
                        <select
                            value={selectedTestTopic}
                            onChange={(e) => setSelectedTestTopic(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                        >
                            {Object.entries(PUSH_TOPICS).map(([key, t]) => (
                                <option key={key} value={key}>{t.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleSendTestPush}
                            disabled={!isSubscribed || isSendingTest}
                            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isSendingTest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                            Enviar Notificación de Prueba
                        </button>
                    </div>
                </div>

                {/* Columna 2: Tópicos de Alerta */}
                <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                            <Sliders size={16} className="text-indigo-600" /> Tópicos & Categorías de Alerta
                        </h4>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {activeTopics.length} de {Object.keys(PUSH_TOPICS).length} Activas
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(PUSH_TOPICS).map(([key, topic]) => {
                            const isSelected = activeTopics.includes(key);
                            return (
                                <div
                                    key={key}
                                    onClick={() => handleToggleTopic(key)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                                        isSelected 
                                            ? 'bg-indigo-50/50 border-indigo-200 shadow-xs' 
                                            : 'bg-slate-50 border-slate-200 opacity-60'
                                    }`}
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border ${
                                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'
                                    }`}>
                                        {isSelected && <CheckCircle2 size={14} />}
                                    </div>
                                    <div>
                                        <span className="font-bold text-xs text-slate-800 block">{topic.label}</span>
                                        <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">{topic.desc}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Historial de Alertas Recibidas */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h4 className="font-extrabold text-slate-800 text-base">Historial de Notificaciones Disparadas</h4>
                        <p className="text-slate-400 text-xs mt-0.5">Auditoría local de eventos y alertas enviadas al navegador.</p>
                    </div>
                    <button
                        onClick={loadLogs}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <Clock size={14} /> Actualizar
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                            <tr>
                                <th className="p-4">Identificador</th>
                                <th className="p-4">Título</th>
                                <th className="p-4">Mensaje</th>
                                <th className="p-4">Categoría / Tag</th>
                                <th className="p-4">Fecha & Hora</th>
                                <th className="p-4 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pushLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                                        No se han registrado notificaciones push aún. Presione "Enviar Notificación de Prueba" para verificar.
                                    </td>
                                </tr>
                            ) : (
                                pushLogs.map((l) => (
                                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 font-mono font-bold text-slate-500">{l.id}</td>
                                        <td className="p-4 font-bold text-slate-800">{l.title}</td>
                                        <td className="p-4 text-slate-600 max-w-md truncate">{l.body}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 font-mono">
                                                {l.tag}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500">
                                            {new Date(l.date).toLocaleString('es-CR')}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                ENTREGADO
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
