
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const availableRides = state.rides.filter(r => r.status === RideStatus.WAITING);
  const currentRide = state.rides.find(r => r.assignedDriverId === driver.id && r.status === RideStatus.IN_PROGRESS);
  const isAnyRideOfferedToMe = availableRides.some(r => r.offeredToDriverId === driver.id);

  useEffect(() => {
    // Simulate a notification sound only for the driver the ride is offered to.
    if (isAnyRideOfferedToMe) {
        if (!audioRef.current) {
            // A subtle notification sound data URI
            audioRef.current = new Audio("data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaW5nIENTUkFQXlBSU0s//CRIlQXgBwwAAABlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-...");
            audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        }
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
       <div className="bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold ${driver.isAvailable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {driver.position}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Posição na Fila</h2>
                    <p className="text-slate-400">Você é o próximo motorista a ser chamado.</p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 py-2 px-4 rounded-full w-full sm:w-auto justify-center">
                  <TrophyIcon className="w-5 h-5" />
                  <span className="font-bold text-lg">{completedRidesCount}</span>
                  <span className="text-sm">corridas finalizadas</span>
              </div>
              <button
                  onClick={handleToggleAvailability}
                  className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-md transition-colors duration-300 w-full sm:w-auto justify-center ${
                      driver.isAvailable
                          ? 'bg-rose-600/80 hover:bg-rose-700/80 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
              >
                  <PowerIcon className="w-5 h-5" />
                  <span>{driver.isAvailable ? 'Ficar Indisponível' : 'Ficar Disponível'}</span>
              </button>
            </div>
       </div>

      {currentRide && (
        <div>
          <h3 className="text-xl font-semibold mb-3 text-sky-400 flex items-center gap-2">
            <RocketIcon className="w-5 h-5"/>
            Corrida em Atendimento
          </h3>
          <RideCard ride={currentRide}>
            <div className="mt-4 flex">
              <button
                onClick={() => handleCompleteRide(currentRide.id)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5"/>
                Finalizar Corrida
              </button>
            </div>
          </RideCard>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold mb-3 text-slate-300 flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-amber-400"/>
            Corridas Disponíveis ({availableRides.length})
        </h3>
        {availableRides.length > 0 ? (
          <div className="space-y-4">
            {availableRides.map(ride => (
              <RideCard key={ride.id} ride={ride}>
                {ride.offeredToDriverId === driver.id && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleAcceptRide(ride.id)}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2"
                    >
                      <CheckCircleIcon className="w-5 h-5"/>
                      Aceitar
                    </button>
                    <button
                      onClick={() => handleDeclineRide(ride.id)}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2"
                    >
                      <XCircleIcon className="w-5 h-5"/>
                      Recusar
                    </button>
                  </div>
                )}
              </RideCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-800 rounded-lg">
            <CoffeeIcon className="w-12 h-12 mx-auto text-slate-500"/>
            <p className="mt-4 text-slate-400">Nenhuma corrida disponível no momento. <br/> Aproveite para tomar um café!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// FIX: Add default export for the component
export default DriverView;
