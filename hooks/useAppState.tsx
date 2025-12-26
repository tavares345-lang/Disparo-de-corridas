
import React, { createContext, useReducer, useContext, ReactNode, useEffect, useRef } from 'react';
import { Driver, Ride, RideStatus } from '../types';

interface AppState {
  drivers: Driver[];
  rides: Ride[];
  adminPassword: string;
  superAdminPassword: string;
  alertTimestamp?: number;
  _isHydrated?: boolean; // Flag para controle de carregamento
}

type Action =
  | { type: 'HYDRATE'; payload: AppState }
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

const COOPTAXI_STATE_KEY = 'cooptaxi_persistent_v2';

// Seed inicial: Apenas usado se o usuário nunca tiver aberto o app ou cadastrado nada
const seedDrivers: Driver[] = [
  { id: 1, name: 'Carlos Silva', unitNumber: '101', vehicleModel: 'Sedan (Spin)', position: 1, isAvailable: false, password: '123' },
  { id: 2, name: 'Mariana Costa', unitNumber: '202', vehicleModel: 'SUV (Duster)', position: 2, isAvailable: false, password: '123' },
  { id: 3, name: 'Roberto Almeida', unitNumber: '303', vehicleModel: 'Sedan (Cronos)', position: 3, isAvailable: false, password: '123' },
  { id: 4, name: 'Juliana Pereira', unitNumber: '404', vehicleModel: 'Minivan', position: 4, isAvailable: false, password: '123' },
  { id: 5, name: 'Fernando Lima', unitNumber: '505', vehicleModel: 'Sedan (Virtus)', position: 5, isAvailable: false, password: '123' },
];

const initialState: AppState = {
  drivers: [],
  rides: [],
  adminPassword: 'Admin',
  superAdminPassword: 'Master123',
  _isHydrated: false
};

const AppStateContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'HYDRATE':
      return { ...action.payload, _isHydrated: true };
    case 'SEND_ALERT':
      return { ...state, alertTimestamp: Date.now() };
    case 'ADD_RIDE': {
      const { specificDriverId, scheduledTime, ...ridePayload } = action.payload;
      if (scheduledTime) {
          return { ...state, rides: [{ ...ridePayload, id: new Date().toISOString(), status: RideStatus.SCHEDULED, scheduledTime }, ...state.rides] };
      }
      const driverToOffer = specificDriverId
        ? state.drivers.find(d => d.id === specificDriverId)
        : state.drivers.filter(d => d.isAvailable).sort((a,b) => a.position - b.position)[0];
      return {
        ...state,
        rides: [{ ...ridePayload, id: new Date().toISOString(), status: RideStatus.WAITING, offeredToDriverId: driverToOffer?.id }, ...state.rides],
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
      return { ...state, drivers: [...state.drivers, { id: newId, name, unitNumber, vehicleModel, position: newPosition, isAvailable: false, password: password || '123' }] };
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
  const isInternalUpdate = useRef(false);

  // Hidratação inicial
  useEffect(() => {
    const loadState = () => {
      try {
        const stored = localStorage.getItem(COOPTAXI_STATE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Garantir que não carregamos um estado vazio por erro de JSON
          if (parsed && Array.isArray(parsed.drivers)) {
            dispatch({ type: 'HYDRATE', payload: parsed });
            return;
          }
        }
        // Se não houver nada no storage, injeta o seed inicial pela primeira vez
        dispatch({ type: 'HYDRATE', payload: { ...initialState, drivers: seedDrivers } });
      } catch (e) {
        console.error("Falha ao carregar estado:", e);
        dispatch({ type: 'HYDRATE', payload: { ...initialState, drivers: seedDrivers } });
      }
    };
    loadState();
  }, []);

  // Sincronização entre abas (Aba B escuta mudanças feitas na Aba A)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COOPTAXI_STATE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          isInternalUpdate.current = true;
          dispatch({ type: 'HYDRATE', payload: newState });
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Salva no localStorage quando o estado muda (apenas se estiver hidratado)
  useEffect(() => {
    if (state._isHydrated && !isInternalUpdate.current) {
      localStorage.setItem(COOPTAXI_STATE_KEY, JSON.stringify(state));
    }
    isInternalUpdate.current = false;
  }, [state]);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppStateProvider');
  return context;
};
