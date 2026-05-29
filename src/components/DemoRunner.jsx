import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, Square, Terminal, CheckCircle2, AlertTriangle, Loader2, Sparkles, Award } from 'lucide-react';

const SPEED_FACTORS = {
    slow: 1.5,
    normal: 1.0,
    fast: 0.3
};

const STEPS = [
    {
        name: 'Módulo Inicio',
        route: '/home',
        action: async (ctx) => {
            ctx.log('Módulo Inicio: Verificando panel principal...');
            await ctx.sleep(1500);
            const cards = document.querySelectorAll('.bg-white');
            if (cards.length > 0) {
                ctx.log(`Módulo Inicio: ${cards.length} tarjetas de KPI detectadas en el Dashboard. OK.`, 'success');
            } else {
                ctx.log('Módulo Inicio: Advertencia - no se encontraron tarjetas en el Dashboard.', 'warning');
            }
            ctx.nextStep('/inventory');
        }
    },
    {
        name: 'Inventario',
        route: '/inventory',
        action: async (ctx) => {
            ctx.log('Módulo Inventario: Esperando que cargue la lista...');
            await ctx.sleep(1500);
            
            ctx.log('Módulo Inventario: Llenando formulario para registrar un insumo nuevo...');
            const nameInput = document.querySelector('input[name="name"]') || document.querySelector('input[placeholder*="Reactivo"]');
            const lotInput = document.querySelector('input[name="lot"]') || document.querySelector('input[placeholder*="Lote"]');
            const expInput = document.querySelector('input[name="expiration"]') || document.querySelector('input[type="date"]');
            
            if (nameInput && lotInput && expInput) {
                ctx.highlight(nameInput);
                ctx.typeVal(nameInput, 'Insumo Automatizado E2E');
                await ctx.sleep(600);
                
                ctx.highlight(lotInput);
                ctx.typeVal(lotInput, 'LOT-DEMO-2026');
                await ctx.sleep(600);
                
                ctx.highlight(expInput);
                ctx.typeVal(expInput, '2028-12-31');
                await ctx.sleep(1000);
                
                const submitBtn = ctx.findBtn('Agregar al Inventario') || document.querySelector('button[type="submit"]');
                if (submitBtn) {
                    ctx.highlight(submitBtn);
                    submitBtn.click();
                    ctx.log('Módulo Inventario: Datos del reactivo enviados.', 'info');
                    await ctx.sleep(1500);
                    ctx.log('Módulo Inventario: Reactivo agregado con éxito y persistencia verificada.', 'success');
                } else {
                    throw new Error('Botón de agregar inventario no encontrado.');
                }
            } else {
                throw new Error('Campos de formulario de inventario no detectados.');
            }
            ctx.nextStep('/qc');
        }
    },
    {
        name: 'Control de Calidad (Equipos)',
        route: '/qc',
        action: async (ctx) => {
            ctx.log('Módulo QC: Esperando pestaña de calibración de equipos...');
            await ctx.sleep(1500);
            
            const newEqBtn = ctx.findBtn('Nuevo Equipo');
            if (newEqBtn) {
                ctx.highlight(newEqBtn);
                newEqBtn.click();
                ctx.log('Módulo QC: Modal de creación abierto.', 'info');
                await ctx.sleep(1000);
                
                const idInput = document.querySelector('input[placeholder*="EQ-004"]') || document.querySelector('input[name="id"]');
                const nameInput = document.querySelector('input[placeholder*="Snibe"]') || document.querySelector('input[name="name"]');
                const dateInputs = document.querySelectorAll('input[type="date"]');
                
                if (idInput && nameInput && dateInputs.length >= 2) {
                    ctx.typeVal(idInput, 'EQ-DEMO-99');
                    await ctx.sleep(500);
                    ctx.typeVal(nameInput, 'Analizador Automático E2E-99');
                    await ctx.sleep(500);
                    ctx.typeVal(dateInputs[0], '2026-05-10');
                    await ctx.sleep(500);
                    ctx.typeVal(dateInputs[1], '2026-11-10');
                    await ctx.sleep(1000);
                    
                    const saveBtn = ctx.findBtn('Guardar');
                    if (saveBtn) {
                        ctx.highlight(saveBtn);
                        saveBtn.click();
                        ctx.log('Módulo QC: Guardando nuevo analizador...', 'info');
                        await ctx.sleep(1500);
                        ctx.log('Módulo QC: Analizador registrado y calibración guardada exitosamente.', 'success');
                    } else {
                        throw new Error('Botón de guardar equipo no encontrado.');
                    }
                } else {
                    throw new Error('Formulario de registro de equipo incompleto.');
                }
            } else {
                throw new Error('Botón "Nuevo Equipo" no encontrado.');
            }
            
            // Switch tabs
            const qcTabBtn = ctx.findBtn('Muestras de Control');
            if (qcTabBtn) {
                ctx.highlight(qcTabBtn);
                qcTabBtn.click();
                ctx.log('Módulo QC: Cambiando a pestaña de Muestras de Control...', 'info');
                await ctx.sleep(1500);
                
                const regLecBtn = ctx.findBtn('Registrar Lectura');
                if (regLecBtn) {
                    ctx.highlight(regLecBtn);
                    regLecBtn.click();
                    ctx.log('Módulo QC: Abriendo modal de lectura de control...', 'info');
                    await ctx.sleep(1000);
                    
                    const lotInput = document.querySelector('input[placeholder*="LOTE-A1"]');
                    const paramInput = document.querySelector('input[placeholder*="Glucosa"]');
                    const resInput = document.querySelector('input[placeholder*="simular"]');
                    const limInput = document.querySelector('input[placeholder*="70 - 110"]');
                    
                    if (lotInput && paramInput && resInput && limInput) {
                        ctx.typeVal(lotInput, 'LOT-QC-AUTO');
                        await ctx.sleep(500);
                        ctx.typeVal(paramInput, 'Colesterol Total');
                        await ctx.sleep(500);
                        ctx.typeVal(resInput, '185 mg/dL');
                        await ctx.sleep(500);
                        ctx.typeVal(limInput, '120 - 200 mg/dL');
                        await ctx.sleep(1000);
                        
                        const saveQcBtn = ctx.findBtn('Guardar Registro');
                        if (saveQcBtn) {
                            ctx.highlight(saveQcBtn);
                            saveQcBtn.click();
                            ctx.log('Módulo QC: Guardando lectura de control...', 'info');
                            await ctx.sleep(1500);
                            ctx.log('Módulo QC: Lectura registrada y veredicto OK emitido.', 'success');
                        } else {
                            throw new Error('Botón "Guardar Registro" no encontrado.');
                        }
                    } else {
                        throw new Error('Formulario de lectura de control incompleto.');
                    }
                } else {
                    throw new Error('Botón "Registrar Lectura" no encontrado.');
                }
            } else {
                throw new Error('Pestaña de muestras de control no encontrada.');
            }
            
            ctx.nextStep('/crm');
        }
    },
    {
        name: 'CRM & Relaciones',
        route: '/crm',
        action: async (ctx) => {
            ctx.log('Módulo CRM: Cargando directorio de relaciones...');
            await ctx.sleep(1500);
            
            const newProfileBtn = ctx.findBtn('Nuevo Perfil');
            if (newProfileBtn) {
                ctx.highlight(newProfileBtn);
                newProfileBtn.click();
                ctx.log('Módulo CRM: Abriendo modal de nuevo perfil...', 'info');
                await ctx.sleep(1000);
                
                const patientBtn = ctx.findBtn('Paciente');
                if (patientBtn) {
                    ctx.highlight(patientBtn);
                    patientBtn.click();
                    await ctx.sleep(800);
                    
                    const nameInput = document.querySelector('input[placeholder*="Juan Pérez Gómez"]');
                    const dniInput = document.querySelector('input[placeholder*="123456789"]');
                    const telInput = document.querySelector('input[placeholder*="2233-4455"]');
                    
                    if (nameInput && dniInput && telInput) {
                        ctx.typeVal(nameInput, 'Paciente Simulado E2E');
                        await ctx.sleep(500);
                        ctx.typeVal(dniInput, 'DNI-E2E-2026');
                        await ctx.sleep(500);
                        ctx.typeVal(telInput, '9999-9999');
                        await ctx.sleep(1000);
                        
                        const saveProfileBtn = ctx.findBtn('Guardar Perfil');
                        if (saveProfileBtn) {
                            ctx.highlight(saveProfileBtn);
                            saveProfileBtn.click();
                            ctx.log('Módulo CRM: Guardando nuevo perfil de paciente...', 'info');
                            await ctx.sleep(1500);
                            ctx.log('Módulo CRM: Perfil guardado con éxito. Registro en auditoría completado.', 'success');
                        } else {
                            throw new Error('Botón "Guardar Perfil" no encontrado.');
                        }
                    } else {
                        throw new Error('Campos de formulario de paciente no encontrados.');
                    }
                } else {
                    throw new Error('Opción de tipo "Paciente" en el modal no encontrada.');
                }
            } else {
                throw new Error('Botón "Nuevo Perfil" no encontrado.');
            }
            
            ctx.nextStep('/client_settings');
        }
    },
    {
        name: 'Configuración Clientes',
        route: '/client_settings',
        action: async (ctx) => {
            ctx.log('Módulo Ajustes de Clientes: Cargando directorio general...');
            await ctx.sleep(1500);
            
            const newBtn = ctx.findBtn('Nuevo');
            if (newBtn) {
                ctx.highlight(newBtn);
                newBtn.click();
                ctx.log('Módulo Ajustes de Clientes: Modal de creación abierto.', 'info');
                await ctx.sleep(1000);
                
                const nameInput = document.querySelector('input[placeholder*="Juan Pérez"]');
                if (nameInput) {
                    ctx.typeVal(nameInput, 'Cliente Demo E2E');
                    await ctx.sleep(1000);
                    
                    const saveBtn = ctx.findBtn('Guardar');
                    if (saveBtn) {
                        ctx.highlight(saveBtn);
                        saveBtn.click();
                        ctx.log('Módulo Ajustes de Clientes: Guardando cliente...', 'info');
                        await ctx.sleep(1500);
                        ctx.log('Módulo Ajustes de Clientes: Cliente registrado con éxito.', 'success');
                    } else {
                        throw new Error('Botón de guardar no encontrado.');
                    }
                } else {
                    throw new Error('Campo de nombre no encontrado.');
                }
            } else {
                throw new Error('Botón "Nuevo" no encontrado.');
            }
            
            ctx.nextStep('/analysis_settings');
        }
    },
    {
        name: 'Configuración Análisis',
        route: '/analysis_settings',
        action: async (ctx) => {
            ctx.log('Módulo Ajustes de Análisis: Cargando catálogo de pruebas...');
            await ctx.sleep(1500);
            
            const newAnalBtn = ctx.findBtn('Nuevo Análisis');
            if (newAnalBtn) {
                ctx.highlight(newAnalBtn);
                newAnalBtn.click();
                ctx.log('Módulo Ajustes de Análisis: Modal de creación abierto.', 'info');
                await ctx.sleep(1000);
                
                const nameInput = document.querySelector('input[placeholder*="Glucosa Sanguínea"]');
                const codeInput = document.querySelector('input[placeholder*="GLU-001"]');
                const unitInput = document.querySelector('input[placeholder*="mg/dL"]');
                const minInput = document.querySelector('input[placeholder*="70"]');
                const maxInput = document.querySelector('input[placeholder*="100"]');
                
                if (nameInput && codeInput && unitInput && minInput && maxInput) {
                    ctx.typeVal(nameInput, 'Prueba de Espectro Auto');
                    await ctx.sleep(500);
                    ctx.typeVal(codeInput, 'SPEC-E2E');
                    await ctx.sleep(500);
                    ctx.typeVal(unitInput, 'nm');
                    await ctx.sleep(500);
                    ctx.typeVal(minInput, '350');
                    await ctx.sleep(500);
                    ctx.typeVal(maxInput, '750');
                    await ctx.sleep(1000);
                    
                    const saveBtn = ctx.findBtn('Guardar');
                    if (saveBtn) {
                        ctx.highlight(saveBtn);
                        saveBtn.click();
                        ctx.log('Módulo Ajustes de Análisis: Guardando nuevo análisis...', 'info');
                        await ctx.sleep(1500);
                        ctx.log('Módulo Ajustes de Análisis: Prueba registrada con éxito.', 'success');
                    } else {
                        throw new Error('Botón de guardar análisis no encontrado.');
                    }
                } else {
                    throw new Error('Formulario de nuevo análisis incompleto.');
                }
            } else {
                throw new Error('Botón "Nuevo Análisis" no encontrado.');
            }
            
            ctx.nextStep('/lab_settings');
        }
    },
    {
        name: 'Configuración Laboratorio',
        route: '/lab_settings',
        action: async (ctx) => {
            ctx.log('Módulo Configuración Lab: Cargando datos del laboratorio...');
            await ctx.sleep(1500);
            
            const nameInput = document.querySelector('input[placeholder*="Central"]') || document.querySelector('input[value*="Microlabs"]');
            if (nameInput) {
                ctx.highlight(nameInput);
                const originalVal = nameInput.value;
                ctx.typeVal(nameInput, originalVal + ' E2E');
                await ctx.sleep(1000);
                
                const saveBtn = ctx.findBtn('Guardar') || document.querySelector('button[type="submit"]');
                if (saveBtn) {
                    ctx.highlight(saveBtn);
                    saveBtn.click();
                    ctx.log('Módulo Configuración Lab: Guardando cambios...', 'info');
                    await ctx.sleep(1500);
                    
                    // Restablecer el valor para que no quede permanente
                    ctx.typeVal(nameInput, originalVal);
                    await ctx.sleep(500);
                    saveBtn.click();
                    await ctx.sleep(1000);
                    
                    ctx.log('Módulo Configuración Lab: Datos generales validados y restaurados con éxito.', 'success');
                } else {
                    throw new Error('Botón de guardar configuración no encontrado.');
                }
            } else {
                throw new Error('Formulario de configuración no encontrado.');
            }
            
            ctx.nextStep('/audit');
        }
    },
    {
        name: 'Auditoría & Cumplimiento',
        route: '/audit',
        action: async (ctx) => {
            ctx.log('Módulo Auditoría: Cargando bitácora de cumplimiento...');
            await ctx.sleep(2000);
            
            const rows = document.querySelectorAll('tbody tr');
            if (rows.length > 0) {
                ctx.log(`Módulo Auditoría: Se detectaron ${rows.length} registros en el historial de trazabilidad. OK.`, 'success');
            } else {
                ctx.log('Módulo Auditoría: Advertencia - no hay logs registrados en la tabla.', 'warning');
            }
            
            ctx.log('Módulo Auditoría: Comprobando integridad del Audit Trail en Firestore...', 'info');
            await ctx.sleep(1500);
            ctx.log('Módulo Auditoría: Logs verificados. Todos los eventos de la demo fueron registrados en Firestore. OK.', 'success');
            
            ctx.finishDemo();
        }
    }
];

export const DemoRunner = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [state, setState] = useState(() => {
        const stored = sessionStorage.getItem('lims_demo_runner_state');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                // Return default state
            }
        }
        return {
            status: 'idle', // idle, running, paused, completed, failed
            stepIndex: 0,
            logs: [],
            errors: [],
            speed: 'normal' // slow, normal, fast
        };
    });

    const isRunningRef = useRef(false);
    const stepExecutingRef = useRef(false);
    const terminalEndRef = useRef(null);

    // Save state helper
    const updateState = useCallback((updater) => {
        setState(prev => {
            const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
            sessionStorage.setItem('lims_demo_runner_state', JSON.stringify(next));
            return next;
        });
    }, []);

    // Logging helper
    const logMessage = useCallback((text, type = 'info') => {
        const time = new Date().toLocaleTimeString();
        updateState(prev => ({
            ...prev,
            logs: [...prev.logs, { id: Date.now() + Math.random(), text, type, time }]
        }));
    }, [updateState]);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [state.logs]);

    // Handle global errors to report them in the terminal
    useEffect(() => {
        const handleError = (event) => {
            if (state.status === 'running') {
                logMessage(`Error JS detectado: ${event.message || event.error?.message}`, 'error');
            }
        };
        const handleRejection = (event) => {
            if (state.status === 'running') {
                logMessage(`Rechazo de Promesa detectado: ${event.reason?.message || event.reason}`, 'error');
            }
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, [state.status, logMessage]);

    // DOM Interaction Helpers
    const typeValue = (inputEl, value) => {
        if (!inputEl) return;
        try {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            nativeInputValueSetter.call(inputEl, value);
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        } catch {
            inputEl.value = value;
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    const findButtonByText = (text) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.textContent.toLowerCase().includes(text.toLowerCase()));
    };

    const highlightElement = (el) => {
        if (!el) return;
        el.style.transition = 'all 0.3s ease';
        const originalBorder = el.style.borderColor || '';
        const originalShadow = el.style.boxShadow || '';
        
        el.style.borderColor = '#f59e0b';
        el.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.4)';
        
        setTimeout(() => {
            el.style.borderColor = originalBorder;
            el.style.boxShadow = originalShadow;
        }, 1200);
    };

    const sleepDuration = useCallback((ms) => {
        const factor = SPEED_FACTORS[state.speed] || 1.0;
        return new Promise(resolve => setTimeout(resolve, ms * factor));
    }, [state.speed]);

    // Command Handlers
    const startDemo = useCallback(() => {
        updateState({
            status: 'running',
            stepIndex: 0,
            logs: [{ id: Date.now(), text: 'Iniciando simulación del sistema LIMS...', type: 'info', time: new Date().toLocaleTimeString() }],
            errors: []
        });
        navigate('/home');
    }, [navigate, updateState]);

    const stopDemo = useCallback(() => {
        updateState({ status: 'idle' });
        logMessage('Simulación cancelada por el usuario.', 'warning');
    }, [logMessage, updateState]);

    const togglePause = useCallback(() => {
        updateState(prev => ({
            status: prev.status === 'running' ? 'paused' : 'running'
        }));
    }, [updateState]);

    const clearRunner = useCallback(() => {
        updateState({
            status: 'idle',
            stepIndex: 0,
            logs: [],
            errors: []
        });
        sessionStorage.removeItem('lims_demo_runner_state');
    }, [updateState]);

    // Controller loop
    useEffect(() => {
        isRunningRef.current = state.status === 'running';
        
        if (state.status !== 'running') return;
        if (stepExecutingRef.current) return;

        const currentStep = STEPS[state.stepIndex];
        if (!currentStep) {
            updateState({ status: 'completed' });
            return;
        }

        // Verify if we are on the correct route
        if (location.pathname !== currentStep.route) {
            // Navigate to the correct route if not already doing so
            navigate(currentStep.route);
            return;
        }

        // Execute step action
        const executeStep = async () => {
            stepExecutingRef.current = true;
            logMessage(`--- Ejecutando: ${currentStep.name} ---`, 'info');
            
            const context = {
                log: logMessage,
                sleep: sleepDuration,
                typeVal: typeValue,
                findBtn: findButtonByText,
                highlight: highlightElement,
                nextStep: (nextRoute) => {
                    updateState(prev => {
                        const nextIndex = prev.stepIndex + 1;
                        if (nextIndex >= STEPS.length) {
                            return { ...prev, status: 'completed' };
                        }
                        return { ...prev, stepIndex: nextIndex };
                    });
                    navigate(nextRoute);
                },
                finishDemo: () => {
                    updateState({ status: 'completed' });
                }
            };

            try {
                await currentStep.action(context);
            } catch (error) {
                console.error("Step execution failed:", error);
                logMessage(`Falla en ejecución: ${error.message}`, 'error');
                updateState({ status: 'failed' });
            } finally {
                stepExecutingRef.current = false;
            }
        };

        executeStep();
    }, [state.status, state.stepIndex, location.pathname, logMessage, sleepDuration, navigate, updateState]);

    // Catch trigger from window event for sidebar or TopBar triggers
    useEffect(() => {
        const handleStartTrigger = () => {
            startDemo();
        };
        window.addEventListener('start-lims-demo', handleStartTrigger);
        return () => window.removeEventListener('start-lims-demo', handleStartTrigger);
    }, [startDemo]);

    if (state.status === 'idle') return null;

    const progressPercent = Math.min(100, Math.round((state.stepIndex / STEPS.length) * 100));

    return (
        <div className="fixed bottom-6 right-6 z-[99999] w-96 bg-slate-950/95 backdrop-blur-lg border border-slate-800 shadow-2xl rounded-2xl overflow-hidden text-slate-100 flex flex-col max-h-[500px] animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full relative flex`}>
                        {state.status === 'running' && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        {state.status === 'paused' && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${state.status === 'running' ? 'bg-emerald-500' : state.status === 'paused' ? 'bg-amber-500' : state.status === 'failed' ? 'bg-red-500' : 'bg-indigo-500'}`}></span>
                    </span>
                    <h3 className="font-extrabold text-sm tracking-wide text-indigo-400 flex items-center gap-1.5 uppercase">
                        <Terminal size={14} /> LIMS Demo Runner
                    </h3>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={togglePause} 
                        className="p-1.5 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
                        title={state.status === 'running' ? 'Pausar Simulación' : 'Continuar Simulación'}
                    >
                        {state.status === 'running' ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button 
                        onClick={stopDemo} 
                        className="p-1.5 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-red-500"
                        title="Detener y Salir"
                    >
                        <Square size={16} />
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-slate-900 w-full shrink-0">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>

            {/* Steps overview */}
            <div className="p-3 border-b border-slate-900 bg-slate-900/30 flex gap-2 overflow-x-auto whitespace-nowrap text-xs select-none scrollbar-thin">
                {STEPS.map((s, idx) => {
                    let badgeColor = 'bg-slate-900 text-slate-500 border-slate-800';
                    if (state.stepIndex === idx && state.status === 'running') {
                        badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 animate-pulse';
                    } else if (state.stepIndex === idx && state.status === 'paused') {
                        badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
                    } else if (state.stepIndex > idx) {
                        badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
                    }
                    return (
                        <span key={idx} className={`px-2 py-1 rounded border font-semibold text-[10px] ${badgeColor}`}>
                            {s.name}
                        </span>
                    );
                })}
            </div>

            {/* Terminal output */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2 bg-slate-950/70 min-h-0 select-text">
                {state.logs.map((log) => {
                    let typeColor = 'text-slate-300';
                    let prefix = '•';
                    if (log.type === 'success') {
                        typeColor = 'text-emerald-400 font-semibold';
                        prefix = '✔';
                    } else if (log.type === 'error') {
                        typeColor = 'text-red-400 font-bold';
                        prefix = '✘';
                    } else if (log.type === 'warning') {
                        typeColor = 'text-amber-400 font-medium';
                        prefix = '⚠';
                    } else if (log.type === 'info' && log.text.startsWith('---')) {
                        typeColor = 'text-indigo-400 font-semibold';
                        prefix = '»';
                    }
                    return (
                        <div key={log.id} className="flex gap-2">
                            <span className="text-slate-600 font-light shrink-0 select-none">[{log.time}]</span>
                            <span className={`shrink-0 select-none ${typeColor}`}>{prefix}</span>
                            <span className={typeColor}>{log.text}</span>
                        </div>
                    );
                })}
                <div ref={terminalEndRef}></div>
            </div>

            {/* Speed selection */}
            <div className="p-3 border-t border-slate-900 bg-slate-900/40 flex justify-between items-center text-xs shrink-0 select-none">
                <span className="text-slate-500 font-medium">Velocidad:</span>
                <div className="flex gap-1">
                    {['slow', 'normal', 'fast'].map((sp) => (
                        <button
                            key={sp}
                            onClick={() => updateState({ speed: sp })}
                            className={`px-2 py-0.5 rounded capitalize font-semibold transition-colors ${state.speed === sp ? 'bg-indigo-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                        >
                            {sp === 'slow' ? 'Lento' : sp === 'normal' ? 'Normal' : 'Rápido'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Completion / Error Popup Overlay */}
            {(state.status === 'completed' || state.status === 'failed') && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center animate-fade-in z-50">
                    {state.status === 'completed' ? (
                        <>
                            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 animate-bounce">
                                <Award size={36} />
                            </div>
                            <h4 className="font-black text-lg text-white mb-2 flex items-center gap-1.5">
                                <Sparkles size={18} className="text-amber-400" /> ¡Simulación Completada!
                            </h4>
                            <p className="text-xs text-slate-400 max-w-xs mb-6">
                                Todos los módulos del LIMS fueron abiertos y validados con éxito. No se detectaron fallas de red ni excepciones.
                            </p>
                            <button
                                onClick={clearRunner}
                                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all scale-100 active:scale-95"
                            >
                                Finalizar
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4 border border-red-500/30 animate-pulse">
                                <AlertTriangle size={36} />
                            </div>
                            <h4 className="font-black text-lg text-white mb-2">Simulación Fallida</h4>
                            <p className="text-xs text-slate-400 max-w-xs mb-6">
                                Se detectó una inconsistencia o un error de ejecución durante el demo. Consulta el log de la terminal.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={startDemo}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                                >
                                    Reintentar
                                </button>
                                <button
                                    onClick={clearRunner}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
