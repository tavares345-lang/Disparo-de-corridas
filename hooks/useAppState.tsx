
import React, { createContext, useReducer, useContext, ReactNode, useEffect, useRef } from 'react';
import { Driver, Ride, RideStatus } from '../types';

interface AppState {
  drivers: Driver[];
  rides: Ride[];
  adminPassword: string;
  superAdminPassword: string;
  alertTimestamp?: number;
  _isHydrated: boolean; // Flag crítica para controle de persistência
}

type Action =
  | { type: 'HYDRATE'; payload: Omit<AppState, '_isHydrated'> }
  | { type: 'ADD_RIDE'; payload: Omit<Ride, 'id' | 'status'> & { specificDriverId?: number; scheduledTime?: string } }
  | { type: 'ACCEPT_RIDE'; payload: { rideId: string; driverId: number } }
  | { type: 'DECLINE_RIDE'; payload: { rideId: string; driverId: number } }
  | { type: 'COMPLETE_RIDE'; payload: { rideId: string } }
  | { type: 'ADD_DRIVER'; payload: { name: string; unitNumber: string; vehicleModel: string; password?: string } }
  | { type: 'EDIT_DRIVER'; payload: { id: number; name: string; unitNumber: string; vehicleModel: string; password?: string } }
  | { type: 'REMOVE_DRIVER'; payload: { driverId: number } }
  | { type: 'TOGGLE_DRIVER_AVAILABILITY'; payload: { driverId: number } }
  | { type: 'DISPATCH_SCHEDULED_RIDE'; payload: { rideId: string } }
  | { type: 'CHANGE_ADMIN_PASSWORD'; payload: { newPassword: string } }
  | { type: 'CHANGE_SUPER_ADMIN_PASSWORD'; payload: { newPassword: string } }
  | { type: 'SEND_ALERT' };

const COOPTAXI_STATE_KEY = 'cooptaxi_database_v3';

const initialState: AppState = {
  drivers: [],
  rides: [],
  adminPassword: 'Admin',
  superAdminPassword: 'Master123',
  _isHydrated: false
};

const AppStateContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

const appReducer = (state: AppState, action: Action): AppState => {
  // Se não estiver hidratado, a única ação permitida é a hidratação
  if (!state._isHydrated && action.type !== 'HYDRATE') {
    return state;
  }

  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, _isHydrated: true };
    
    case 'SEND_ALERT':
      return { ...state, alertTimestamp: Date.now() };

    case 'ADD_RIDE': {
      const { specificDriverId, scheduledTime, ...ridePayload } = action.payload;
      const newRideId = new Date().toISOString();
      if (scheduledTime) {
        return { ...state, rides: [{ ...ridePayload, id: newRideId, status: RideStatus.SCHEDULED, scheduledTime }, ...state.rides] };
      }
      const driverToOffer = specificDriverId
        ? state.drivers.find(d => d.id === specificDriverId)
        : state.drivers.filter(d => d.isAvailable).sort((a,b) => a.position - b.position)[0];
      return {
        ...state,
        rides: [{ ...ridePayload, id: newRideId, status: RideStatus.WAITING, offeredToDriverId: driverToOffer?.id }, ...state.rides],
        alertTimestamp: Date.now(),
      };
    }

    case 'ACCEPT_RIDE': {
      const { rideId, driverId } = action.payload;
      const ride = state.rides.find(r => r.id === rideId);
      const driver = state.drivers.find(d => d.id === driverId);
      if (!ride || !driver) return state;
      const acceptedDriverPosition = driver.position;
      const updatedRide: Ride = { ...ride, status: RideStatus.IN_PROGRESS, assignedDriverId: driver.id, offeredToDriverId: undefined };
      const updatedDrivers = state.drivers.map(d => {
        if (d.id === driverId) return { ...d, position: state.drivers.length };
        if (d.position > acceptedDriverPosition) return { ...d, position: d.position - 1 };
        return d;
      }).sort((a, b) => a.position - b.position);
      const nextAvailableDriver = updatedDrivers.find(d => d.isAvailable);
      const pendingRide = state.rides.find(r => r.status === RideStatus.WAITING && r.id !== rideId && !r.offeredToDriverId);
      let updatedRides = state.rides.map(r => r.id === rideId ? updatedRide : r);
      if(pendingRide && nextAvailableDriver) {
          updatedRides = updatedRides.map(r => r.id === pendingRide.id ? {...r, offeredToDriverId: nextAvailableDriver.id} : r)
      }
      return { ...state, rides: updatedRides, drivers: updatedDrivers };
    }

    case 'DECLINE_RIDE': {
      const { rideId, driverId } = action.payload;
      const ride = state.rides.find(r => r.id === rideId);
      const driver = state.drivers.find(d => d.id === driverId);
      if (!ride || !driver) return state;
      const declinedDriverPosition = driver.position;
      const updatedDrivers = state.drivers.map(d => {
        if (d.id === driverId) return { ...d, position: state.drivers.length };
        if(d.position > declinedDriverPosition) return { ...d, position: d.position - 1 };
        return d;
      }).sort((a, b) => a.position - b.position);
      const nextAvailableDriverInQueue = updatedDrivers.find(d => d.isAvailable);
      return { ...state, rides: state.rides.map(r => r.id === rideId ? { ...r, offeredToDriverId: nextAvailableDriverInQueue?.id } : r), drivers: updatedDrivers };
    }

    case 'COMPLETE_RIDE':
      return { ...state, rides: state.rides.map(ride => ride.id === action.payload.rideId ? { ...ride, status: RideStatus.COMPLETED } : ride) };

    case 'ADD_DRIVER': {
      const { name, unitNumber, vehicleModel, password } = action.payload;
      const newId = state.drivers.length > 0 ? Math.max(...state.drivers.map(d => d.id)) + 1 : 1;
      const newPosition = state.drivers.length + 1;
      const newDriver: Driver = { id: newId, name, unitNumber, vehicleModel, position: newPosition, isAvailable: false, password: password || '123' };
      return { ...state, drivers: [...state.drivers, newDriver] };
    }

    case 'EDIT_DRIVER':
      return { ...state, drivers: state.drivers.map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d) };

    case 'REMOVE_DRIVER': {
      const driverToRemove = state.drivers.find(d => d.id === action.payload.driverId);
      if (!driverToRemove) return state;
      const remainingDrivers = state.drivers.filter(d => d.id !== action.payload.driverId)
        .map(d => (d.position > driverToRemove.position ? { ...d, position: d.position - 1 } : d))
        .sort((a, b) => a.position - b.position);
      return { ...state, drivers: remainingDrivers };
    }

    case 'TOGGLE_DRIVER_AVAILABILITY':
      return { ...state, drivers: state.drivers.map(d => d.id === action.payload.driverId ? { ...d, isAvailable: !d.isAvailable } : d) };

    case 'CHANGE_ADMIN_PASSWORD':
      return { ...state, adminPassword: action.payload.newPassword };

    case 'CHANGE_SUPER_ADMIN_PASSWORD':
      return { ...state, superAdminPassword: action.payload.newPassword };

    default:
      return state;
  }
};

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const isHydrating = useRef(true);

  // Hidratação inicial a partir do localStorage
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem(COOPTAXI_STATE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Array.isArray(parsed.drivers)) {
            dispatch({ type: 'HYDRATE', payload: parsed });
            isHydrating.current = false;
            return;
          }
        }
        // Se não houver nada, mantém o estado inicial e marca como hidratado
        dispatch({ type: 'HYDRATE', payload: initialState });
      } catch (e) {
        console.error("Erro ao carregar banco de dados local:", e);
        dispatch({ type: 'HYDRATE', payload: initialState });
      }
      isHydrating.current = false;
    };
    loadFromStorage();
  }, []);

  // Sincronização automática entre abas do navegador
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COOPTAXI_STATE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          dispatch({ type: 'HYDRATE', payload: newState });
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Gravação persistente no localStorage (apenas após hidratação)
  useEffect(() => {
    if (state._isHydrated) {
      localStorage.setItem(COOPTAXI_STATE_KEY, JSON.stringify(state));
    }
  }, [state]);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState deve ser usado dentro de AppStateProvider');
  return context;
};
