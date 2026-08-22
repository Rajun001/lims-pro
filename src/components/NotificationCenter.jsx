import React, { useState } from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle2, ShieldAlert, X, ChevronRight } from 'lucide-react';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'CRITICAL_RESULT',
      title: '🚨 Resultado Crítico Detectado',
      message: 'Cortisol Matutino Muestra #CLI-8821 sobrepasa el límite crítico (28.4 µg/dL).',
      time: 'Hace 5 min',
      unread: true
    },
    {
      id: 2,
      type: 'SHELF_LIFE_DUE',
      title: '📅 Alerta Muestreo Vida Útil (RTCA)',
      message: 'Proyecto PRJ-2026-STAB-089 (Emulsión Cosmética) cumple 60 Días en 48 Horas.',
      time: 'Hace 1 hora',
      unread: true
    },
    {
      id: 3,
      type: 'SIGNATURE_PENDING',
      title: '✍️ Firma Electrónica Requerida',
      message: '2 Certificados de Análisis (CoA) pendientes de firma por el Director Técnico.',
      time: 'Hace 3 horas',
      unread: false
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <div className="relative inline-block text-left">
      {/* Botón de Campana con Badge de Alertas Unread */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all focus:outline-none"
        title="Notificaciones y Alertas Reguladas"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover de Notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 text-slate-100 overflow-hidden transform transition-all">
          <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Centro de Alertas Analíticas</h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-emerald-400 hover:underline"
              >
                Marcar leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800">
            {notifications.map(item => (
              <div
                key={item.id}
                className={`p-4 transition-colors hover:bg-slate-800/50 flex gap-3 ${
                  item.unread ? 'bg-slate-800/30' : ''
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {item.type === 'CRITICAL_RESULT' && (
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  )}
                  {item.type === 'SHELF_LIFE_DUE' && (
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="w-4 h-4" />
                    </div>
                  )}
                  {item.type === 'SIGNATURE_PENDING' && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs text-white">{item.title}</h4>
                    <span className="text-[10px] text-slate-500">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 p-2.5 text-center border-t border-slate-800">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              Monitoreo activo ISO 17025 / 15189 <ChevronRight className="w-3 h-3 text-slate-400" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
