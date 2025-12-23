
import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { Driver, Ride, RideStatus } from '../types';

interface AppState {
  drivers: Driver[];
  rides: Ride[];
  adminPassword: string;
}

type Action =
  | { type: 'ADD_RIDE'; payload: Omit<Ride, 'id' | 'status'> & { specificDriverId?: number; scheduledTime?: string } }
  | { type: 'ACCEPT_RIDE'; payload: { rideId: string; driverId: number } }
  | { type: 'DECLINE_RIDE'; payload: { rideId: string; driverId: number } }
  | { type: 'COMPLETE_RIDE'; payload: { rideId: string } }
  | { type: 'ADD_DRIVER'; payload: { name: string; unitNumber: string; vehicleModel: string } }
  | { type: 'EDIT_DRIVER'; payload: { id: number; name: string; unitNumber: string; vehicleModel: string } }
  | { type: 'REMOVE_DRIVER'; payload: { driverId: number } }
  | { type: 'TOGGLE_DRIVER_AVAILABILITY'; payload: { driverId: number } }
  | { type: 'DISPATCH_SCHEDULED_RIDE'; payload: { rideId: string } }
  | { type: 'CHANGE_ADMIN_PASSWORD'; payload: { newPassword: string } };

const initialState: AppState = {
  drivers: [
    { id: 1, name: 'Carlos Silva', unitNumber: '101', vehicleModel: 'Sedan (Spin)', position: 1, isAvailable: true },
    { id: 2, name: 'Mariana Costa', unitNumber: '202', vehicleModel: 'SUV (Duster)', position: 2, isAvailable: true },
    { id: 3, name: 'Roberto Almeida', unitNumber: '303', vehicleModel: 'Sedan (Cronos)', position: 3, isAvailable: true },
    { id: 4, name: 'Juliana Pereira', unitNumber: '404', vehicleModel: 'Minivan', position: 4, isAvailable: true },
    { id: 5, name: 'Fernando Lima', unitNumber: '505', vehicleModel: 'Sedan (Virtus)', position: 5, isAvailable: true },
  ],
  rides: [],
  adminPassword: 'Admin',
};

const AppStateContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_RIDE': {
      const { specificDriverId, scheduledTime, ...ridePayload } = action.payload;

      if (scheduledTime) {
          const newRide: Ride = {
            ...ridePayload,
            id: new Date().toISOString(),
            status: RideStatus.SCHEDULED,
            scheduledTime,
          };
          return {
            ...state,
            rides: [newRide, ...state.rides],
          };
      }

      const driverToOffer = specificDriverId
        ? state.drivers.find(d => d.id === specificDriverId)
        : state.drivers.filter(d => d.isAvailable).sort((a,b) => a.position - b.position)[0];

      const newRide: Ride = {
        ...ridePayload,
        id: new Date().toISOString(),
        status: RideStatus.WAITING,
        offeredToDriverId: driverToOffer?.id,
      };
      return {
        ...state,
        rides: [newRide, ...state.rides],
      };
    }
    case 'ACCEPT_RIDE': {
      const { rideId, driverId } = action.payload;
      const ride = state.rides.find(r => r.id === rideId);
      const driver = state.drivers.find(d => d.id === driverId);

      if (!ride || !driver || ride.offeredToDriverId !== driver.id) {
        return state;
      }
      
      const acceptedDriverPosition = driver.position;

      const updatedRide: Ride = {
        ...ride,
        status: RideStatus.IN_PROGRESS,
        assignedDriverId: driver.id,
        offeredToDriverId: undefined,
      };

      const updatedDrivers = state.drivers
        .map(d => {
          if (d.id === driverId) {
            return { ...d, position: state.drivers.length };
          }
           if (d.position > acceptedDriverPosition) {
            return { ...d, position: d.position - 1 };
          }
          return d;
        })
        .sort((a, b) => a.position - b.position);

      const nextAvailableDriver = updatedDrivers.find(d => d.isAvailable);
      const pendingRide = state.rides.find(r => r.status === RideStatus.WAITING && r.id !== rideId && !r.offeredToDriverId);

      let updatedRides = state.rides.map(r => r.id === rideId ? updatedRide : r);

      if(pendingRide && nextAvailableDriver) {
          updatedRides = updatedRides.map(r => r.id === pendingRide.id ? {...r, offeredToDriverId: nextAvailableDriver.id} : r)
      }

      return {
        ...state,
        rides: updatedRides,
        drivers: updatedDrivers,
      };
    }
    case 'DECLINE_RIDE': {
      const { rideId, driverId } = action.payload;
      const ride = state.rides.find(r => r.id === rideId);
      const driver = state.drivers.find(d => d.id === driverId);

      if (!ride || !driver || ride.offeredToDriverId !== driver.id) {
        return state;
      }
      
      const declinedDriverPosition = driver.position;

      const updatedDrivers = state.drivers
        .map(d => {
          if (d.id === driverId) {
            return { ...d, position: state.drivers.length };
          }
          if(d.position > declinedDriverPosition) {
            return { ...d, position: d.position - 1 };
          }
          return d;
        })
        .sort((a, b) => a.position - b.position);

      const nextAvailableDriverInQueue = updatedDrivers.find(d => d.isAvailable);

      const updatedRides = state.rides.map(r =>
        r.id === rideId
          ? { ...r, offeredToDriverId: nextAvailableDriverInQueue?.id }
          : r
      );

      return {
        ...state,
        rides: updatedRides,
        drivers: updatedDrivers,
      };
    }
    case 'COMPLETE_RIDE': {
      return {
        ...state,
        rides: state.rides.map(ride =>
          ride.id === action.payload.rideId
            ? { ...ride, status: RideStatus.COMPLETED }
            : ride
        ),
      };
    }
    case 'ADD_DRIVER': {
      const { name, unitNumber, vehicleModel } = action.payload;
      const newId = state.drivers.length > 0 ? Math.max(...state.drivers.map(d => d.id)) + 1 : 1;
      const newPosition = state.drivers.length + 1;
      const newDriver: Driver = {
        id: newId,
        name,
        unitNumber,
        vehicleModel,
        position: newPosition,
        isAvailable: true,
      };
      return {
        ...state,
        drivers: [...state.drivers, newDriver],
      };
    }
    case 'EDIT_DRIVER': {
      const { id, ...updatedData } = action.payload;
      return {
        ...state,
        drivers: state.drivers.map(driver =>
          driver.id === id ? { ...driver, ...updatedData } : driver
        ),
      };
    }
    case 'REMOVE_DRIVER': {
      const { driverId } = action.payload;
      const driverToRemove = state.drivers.find(d => d.id === driverId);
      if (!driverToRemove) return state;

      const remainingDrivers = state.drivers.filter(d => d.id !== driverId);
      const updatedDrivers = remainingDrivers
        .map(d => {
          if (d.position > driverToRemove.position) {
            return { ...d, position: d.position - 1 };
          }
          return d;
        })
        .sort((a, b) => a.position - b.position);

      let updatedRides = [...state.rides];

      const affectedRide = updatedRides.find(r => r.offeredToDriverId === driverId || (r.assignedDriverId === driverId && r.status === RideStatus.IN_PROGRESS));

      if (affectedRide) {
        const nextDriver = updatedDrivers.find(d => d.isAvailable);
        updatedRides = updatedRides.map(r =>
          r.id === affectedRide.id
            ? {
                ...r,
                status: RideStatus.WAITING,
                assignedDriverId: undefined,
                offeredToDriverId: nextDriver?.id,
              }
            : r
        );
      }
      
      return {
        ...state,
        drivers: updatedDrivers,
        rides: updatedRides,
      };
    }
    case 'TOGGLE_DRIVER_AVAILABILITY': {
      let driverBecameAvailable = false;
      const updatedDrivers = state.drivers.map(d => {
        if (d.id === action.payload.driverId) {
          if (!d.isAvailable) {
            driverBecameAvailable = true;
          }
          return { ...d, isAvailable: !d.isAvailable };
        }
        return d;
      });

      if (driverBecameAvailable) {
        const unassignedRide = state.rides.find(r => r.status === RideStatus.WAITING && !r.offeredToDriverId);
        if (unassignedRide) {
          const firstAvailableDriver = updatedDrivers.filter(d => d.isAvailable).sort((a, b) => a.position - b.position)[0];
          if (firstAvailableDriver) {
            const updatedRides = state.rides.map(r =>
              r.id === unassignedRide.id ? { ...r, offeredToDriverId: firstAvailableDriver.id } : r
            );
            return { ...state, drivers: updatedDrivers, rides: updatedRides };
          }
        }
      }
      
      return { ...state, drivers: updatedDrivers };
    }
    case 'DISPATCH_SCHEDULED_RIDE': {
      const rideToDispatch = state.rides.find(r => r.id === action.payload.rideId);
      if (!rideToDispatch || rideToDispatch.status !== RideStatus.SCHEDULED) {
        return state;
      }
      
      const firstAvailableDriver = state.drivers.filter(d => d.isAvailable).sort((a, b) => a.position - b.position)[0];

      const updatedRides = state.rides.map(r => {
        if (r.id === action.payload.rideId) {
          return {
            ...r,
            status: RideStatus.WAITING,
            scheduledTime: undefined,
            offeredToDriverId: firstAvailableDriver?.id,
          };
        }
        return r;
      });

      return { ...state, rides: updatedRides };
    }
    case 'CHANGE_ADMIN_PASSWORD': {
      return {
        ...state,
        adminPassword: action.payload.newPassword,
      };
    }
    default:
      return state;
  }
};

const COOPTAXI_STATE_KEY = 'cooptaxi_app_state';
const channel = new BroadcastChannel('cooptaxi_channel');

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    try {
      const storedState = localStorage.getItem(COOPTAXI_STATE_KEY);
      const parsedState = storedState ? JSON.parse(storedState) : initial;
      // Merge stored state with initial to handle new fields like adminPassword if they are missing
      return { ...initial, ...parsedState };
    } catch (error) {
      console.error("Error reading from localStorage", error);
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COOPTAXI_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Error writing to localStorage", error);
    }
  }, [state]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<Action>) => {
      dispatch(event.data);
    };
    channel.addEventListener('message', handleMessage);
    return () => {
      channel.removeEventListener('message', handleMessage);
    };
  }, []);

  const broadcastDispatch = (action: Action) => {
    dispatch(action);
    channel.postMessage(action);
  };

  return (
    <AppStateContext.Provider value={{ state, dispatch: broadcastDispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
