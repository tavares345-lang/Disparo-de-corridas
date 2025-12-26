
import React, { useEffect, useRef } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Driver, RideStatus } from '../types';
import RideCard from './RideCard';
import { BellIcon, CheckCircleIcon, CoffeeIcon, TrophyIcon, XCircleIcon, RocketIcon, PowerIcon, UserIcon, MapPinIcon, DollarSignIcon } from './Icons';

interface DriverViewProps {
  driver: Driver;
}

const DriverView: React.FC<DriverViewProps> = ({ driver }) => {
  const { state, dispatch } = useAppState();
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastAlertHandledRef = useRef<number>(0);

  const availableRides = state.rides.filter(r => r.status === RideStatus.WAITING);
  const currentRide = state.rides.find(r => r.assignedDriverId === driver.id && r.status === RideStatus.IN_PROGRESS);
  const isAnyRideOfferedToMe = availableRides.some(r => r.offeredToDriverId === driver.id);

  // Filtra motoristas disponíveis para saber a posição na fila de atendimento imediato
  const driversOnline = state.drivers
    .filter(d => d.isAvailable)
    .sort((a, b) => a.position - b.position);
  
  const positionInAvailability = driversOnline.findIndex(d => d.id === driver.id) + 1;

  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Som não pôde ser reproduzido:", e);
    }
  };

  useEffect(() => {
    if (driver.isAvailable && state.alertTimestamp && state.alertTimestamp > lastAlertHandledRef.current) {
      playNotificationSound();
      lastAlertHandledRef.current = state.alertTimestamp;
    }
  }, [state.alertTimestamp, driver.isAvailable]);

  const handleToggleAvailability = () => {
    dispatch({ type: 'TOGGLE_DRIVER_AVAILABILITY', payload: { driverId: driver.id } });
  }

  const handleAcceptRide = (rideId: string) => {
    dispatch({ type: 'ACCEPT_RIDE', payload: { rideId, driverId: driver.id } });
  };

  const handleDeclineRide = (rideId: string) => {
    dispatch({ type: 'DECLINE_RIDE', payload: { rideId, driverId: driver.id } });
  };

  const handleCompleteRide = (rideId: string) => {
    dispatch({ type: 'COMPLETE_RIDE', payload: { rideId } });
  };

  const completedRides = state.rides
    .filter(r => r.assignedDriverId === driver.id && r.status === RideStatus.COMPLETED)
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 5);

  const completedRidesCount = state.rides.filter(r => r.assignedDriverId === driver.id && r.status === RideStatus.COMPLETED).length;

  return (
    <div className="space-y-6">
       {/* Card de Status Principal - Novo Layout Requisitado */}
       <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-slate-700/50">
            <div className="flex flex-col lg:flex-row items-center gap-8">
                
                {/* Visualizador de Posição */}
                <div className="relative flex-shrink-0">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-inner ${
                        driver.isAvailable 
                          ? 'bg-emerald-500/10 border-[6px] border-emerald-500/30' 
                          : 'bg-rose-500/10 border-[6px] border-rose-500/30'
                    }`}>
                        <span className={`text-6xl font-black ${driver.isAvailable ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {driver.isAvailable ? positionInAvailability : '-'}
                        </span>
                        
                        {/* Indicador de Fila Online Reestilizado */}
                        {driver.isAvailable && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-slate-800 whitespace-nowrap animate-bounce-slow">
                                FILA ONLINE
                            </div>
                        )}
                    </div>
                    {/* Ring animado se estiver online */}
                    {driver.isAvailable && (
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-20 pointer-events-none" />
                    )}
                </div>

                {/* Informações e Status */}
                <div className="flex-grow text-center lg:text-left">
                    <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                        {driver.isAvailable 
                          ? `Próximo da Fila: ${positionInAvailability}º` 
                          : 'Você está Fora de Serviço'}
                    </h2>
                    <p className="text-slate-400 mt-1 font-medium">
                        Sua posição geral na cooperativa é <span className="text-amber-400 font-black">{driver.position}º</span>
                    </p>
                    
                    {/* Estatística rápida integrada */}
                    <div className="flex justify-center lg:justify-start mt-4">
                        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 py-1.5 px-4 rounded-full border border-emerald-500/20 text-sm">
                            <TrophyIcon className="w-4 h-4" />
                            <span className="font-bold">{completedRidesCount}</span>
                            <span className="font-medium opacity-80">finalizadas hoje</span>
                        </div>
                    </div>
                </div>

                {/* Botão de Ação Principal */}
                <div className="w-full lg:w-auto">
                    <button
                        onClick={handleToggleAvailability}
                        className={`flex items-center gap-3 font-black py-5 px-10 rounded-2xl transition-all duration-300 w-full lg:w-auto justify-center shadow-2xl transform active:scale-95 group overflow-hidden relative ${
                            driver.isAvailable
                                ? 'bg-gradient-to-br from-rose-500 to-rose-700 text-white'
                                : 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
                        }`}
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <PowerIcon className="w-7 h-7 relative z-10" />
                        <span className="text-lg tracking-wider relative z-10">
                          {driver.isAvailable ? 'ENCERRAR TURNO' : 'INICIAR ATENDIMENTO'}
                        </span>
                    </button>
                </div>
            </div>

            {!driver.isAvailable && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs font-semibold text-center uppercase tracking-widest flex items-center justify-center gap-2">
                    <BellIcon className="w-4 h-4 opacity-70" />
                    Atenção: Ative seu status para receber chamados do operador
                </div>
            )}
       </div>

      {currentRide && (
        <div className="animate-pulse-slow">
          <h3 className="text-xl font-bold mb-3 text-sky-400 flex items-center gap-2 uppercase tracking-wider">
            <RocketIcon className="w-6 h-6"/>
            Corrida em Atendimento
          </h3>
          <RideCard ride={currentRide}>
            <div className="mt-6">
              <button
                onClick={() => handleCompleteRide(currentRide.id)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black py-4 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2 text-lg shadow-xl"
              >
                <CheckCircleIcon className="w-6 h-6"/>
                FINALIZAR CORRIDA
              </button>
            </div>
          </RideCard>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold mb-3 text-slate-100 flex items-center gap-2 uppercase tracking-wider">
            <BellIcon className={`w-6 h-6 ${isAnyRideOfferedToMe ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`}/>
            Chamados Disponíveis
        </h3>
        {availableRides.some(r => r.offeredToDriverId === driver.id) ? (
          <div className="space-y-4">
            {availableRides.filter(r => r.offeredToDriverId === driver.id).map(ride => (
              <div key={ride.id} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <RideCard ride={ride}>
                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => handleAcceptRide(ride.id)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black py-4 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2 text-lg shadow-lg"
                      >
                        <CheckCircleIcon className="w-6 h-6"/>
                        ACEITAR
                      </button>
                      <button
                        onClick={() => handleDeclineRide(ride.id)}
                        className="flex-1 bg-slate-700 hover:bg-rose-600 text-white font-bold py-4 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2 shadow-lg"
                      >
                        <XCircleIcon className="w-5 h-5"/>
                        RECUSAR
                      </button>
                    </div>
                  </RideCard>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-800/40 rounded-3xl border-2 border-dashed border-slate-700/50">
            <CoffeeIcon className="w-16 h-16 mx-auto text-slate-700 mb-4"/>
            <p className="text-slate-300 text-xl font-bold">Sem novos chamados no momento.</p>
            <p className="text-slate-500 text-sm mt-1">Você será notificado assim que sua vez chegar.</p>
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 rounded-2xl shadow-lg p-6 border border-slate-700/50 mt-6">
        <h3 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
          <CheckCircleIcon className="w-6 h-6" />
          Meu Histórico Recente
        </h3>
        {completedRides.length > 0 ? (
          <div className="space-y-3">
            {completedRides.map(ride => (
              <div key={ride.id} className="flex justify-between items-center p-4 bg-slate-700/20 rounded-xl border border-slate-600/30 hover:bg-slate-700/40 transition-colors">
                <div className="flex items-start gap-3 flex-grow min-w-0">
                  <MapPinIcon className="w-4 h-4 mt-1 text-rose-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-100 truncate">{ride.destination}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mt-0.5">{ride.time} • {new Date(ride.id).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-4 shrink-0 text-amber-400 font-black text-xl">
                  <DollarSignIcon className="w-4 h-4" />
                  <span>{ride.fare.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-600 italic text-sm">Nenhuma corrida finalizada ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverView;
