import React from 'react';
import { Ride, RideStatus } from '../types';
import { ClockIcon, DollarSignIcon, MapPinIcon, CheckCircleIcon, RocketIcon } from './Icons';
import { useAppState } from '../hooks/useAppState';

interface RideCardProps {
  ride: Ride;
  children?: React.ReactNode;
}

const RideCard: React.FC<RideCardProps> = ({ ride, children }) => {
  const { state } = useAppState();

  const getStatusContent = () => {
    const driver = state.drivers.find(d => d.id === (ride.assignedDriverId || ride.offeredToDriverId));
    
    if (!driver) {
      return (
        <div className="bg-slate-600 text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-full text-center">
          Aguardando na fila
        </div>
      );
    }
    
    const driverInfo = `${driver.name} (Un. ${driver.unitNumber})`;
    const vehicleInfo = driver.vehicleModel;

    const baseClasses = "text-xs font-semibold px-2.5 py-1 rounded-full";

    switch (ride.status) {
      case RideStatus.WAITING:
        return (
          <div className={`${baseClasses} bg-yellow-500/20 text-yellow-300 text-center`}>
            <p>Oferecida para: {driverInfo}</p>
          </div>
        );
      case RideStatus.IN_PROGRESS:
         return (
          <div className={`${baseClasses} bg-sky-500/20 text-sky-300 text-left`}>
            <p className="flex items-center gap-1.5"><RocketIcon className="w-3 h-3" /> {driverInfo}</p>
            <p className="text-sky-400/80 pl-[18px] text-[10px]">{vehicleInfo}</p>
          </div>
        );
      case RideStatus.COMPLETED:
        return (
          <div className={`${baseClasses} bg-emerald-500/20 text-emerald-300 text-left`}>
            <p className="flex items-center gap-1.5"><CheckCircleIcon className="w-3 h-3" /> {driverInfo}</p>
             <p className="text-emerald-400/80 pl-[18px] text-[10px]">{vehicleInfo}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-5 border border-slate-700">
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex-grow">
            <p className="text-sm text-slate-400">ID: {ride.id.substring(0, 8)}</p>
        </div>
        {getStatusContent()}
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <MapPinIcon className="w-5 h-5 mt-1 text-emerald-400" />
          <div>
            <p className="text-sm text-slate-400">Embarque</p>
            <p className="font-semibold text-slate-100">{ride.pickup}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPinIcon className="w-5 h-5 mt-1 text-rose-400" />
          <div>
            <p className="text-sm text-slate-400">Destino</p>
            <p className="font-semibold text-slate-100">{ride.destination}</p>
          </div>
        </div>
        <div className="border-t border-slate-700 my-3"></div>
        <div className="flex justify-between items-center text-sm">
           <div className="flex items-center gap-2 text-slate-300">
             <ClockIcon className="w-4 h-4 text-slate-400" />
             <span>{ride.time}</span>
           </div>
           <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
             <DollarSignIcon className="w-4 h-4" />
             <span>{ride.fare.toFixed(2).replace('.', ',')}</span>
           </div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default RideCard;
