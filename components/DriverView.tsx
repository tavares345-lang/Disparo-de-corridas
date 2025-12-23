
import React, { useEffect, useRef } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Driver, RideStatus } from '../types';
import RideCard from './RideCard';
import { BellIcon, CheckCircleIcon, CoffeeIcon, TrophyIcon, XCircleIcon, RocketIcon, PowerIcon } from './Icons';

interface DriverViewProps {
  driver: Driver;
}

const DriverView: React.FC<DriverViewProps> = ({ driver }) => {
  const { state, dispatch } = useAppState();
  const audioContextRef = useRef<AudioContext | null>(null);

  const availableRides = state.rides.filter(r => r.status === RideStatus.WAITING);
  const currentRide = state.rides.find(r => r.assignedDriverId === driver.id && r.status === RideStatus.IN_PROGRESS);
  const isAnyRideOfferedToMe = availableRides.some(r => r.offeredToDriverId === driver.id);

  // Play sound function using Web Audio API for a reliable "beep/ding"
  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // Slide to A4

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Could not play sound:", e);
    }
  };

  useEffect(() => {
    if (isAnyRideOfferedToMe) {
        playNotificationSound();
    }
  }, [isAnyRideOfferedToMe]);

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

  const completedRidesCount = state.rides.filter(r => r.assignedDriverId === driver.id && r.status === RideStatus.COMPLETED).length;

  return (
    <div className="space-y-6">
       <div className="bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border border-slate-700">
            <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-3xl font-bold ${driver.isAvailable ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-rose-500/10 border-rose-500 text-rose-400'}`}>
                    {driver.position}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Sua Posição na Fila</h2>
                    <p className="text-slate-400">
                      {driver.isAvailable ? 'Você está na fila para receber corridas.' : 'Você está offline. Fique disponível para receber chamados.'}
                    </p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 py-2 px-4 rounded-full w-full sm:w-auto justify-center border border-emerald-500/30">
                  <TrophyIcon className="w-5 h-5" />
                  <span className="font-bold text-lg">{completedRidesCount}</span>
                  <span className="text-sm">finalizadas</span>
              </div>
              <button
                  onClick={handleToggleAvailability}
                  className={`flex items-center gap-2 font-bold py-2 px-6 rounded-md transition-all duration-300 w-full sm:w-auto justify-center shadow-lg transform active:scale-95 ${
                      driver.isAvailable
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
              >
                  <PowerIcon className="w-5 h-5" />
                  <span>{driver.isAvailable ? 'FICAR OFFLINE' : 'FICAR DISPONÍVEL'}</span>
              </button>
            </div>
       </div>

      {currentRide && (
        <div className="animate-pulse-slow">
          <h3 className="text-xl font-bold mb-3 text-sky-400 flex items-center gap-2 uppercase tracking-wider">
            <RocketIcon className="w-6 h-6"/>
            Atendimento em Curso
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
            <BellIcon className="w-6 h-6 text-amber-400 animate-bounce"/>
            Corridas para Aceite ({availableRides.filter(r => r.offeredToDriverId === driver.id).length})
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
                        ACEITAR CORRIDA
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
          <div className="text-center py-16 bg-slate-800/40 rounded-xl border-2 border-dashed border-slate-700">
            <CoffeeIcon className="w-16 h-16 mx-auto text-slate-600 mb-4"/>
            <p className="text-slate-400 text-lg">Sem chamados diretos para você agora.</p>
            <p className="text-slate-500 text-sm">Aguarde sua vez na fila...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverView;
