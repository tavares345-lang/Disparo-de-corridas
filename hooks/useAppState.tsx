
import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { Driver, Ride, RideStatus } from '../types';
import { db, auth } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch, 
  getDoc,
  query,
  orderBy,
  limit,
  getDocs,
  runTransaction
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

interface AppState {
  drivers: Driver[];
  rides: Ride[];
  superAdminPassword: string;
  alertTimestamp?: number;
  _isHydrated: boolean;
}

interface AppContextType {
  state: AppState;
  dispatch: (action: any) => void; // Keeping the signature for compatibility
}

const AppStateContext = createContext<AppContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    drivers: [],
    rides: [],
    superAdminPassword: 'Master123',
    _isHydrated: false
  });

  const [isAuthReady, setIsAuthReady] = useState(false);

  // Auth initialization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Usuário autenticado:", user.uid);
      } else {
        signInAnonymously(auth).catch(err => {
          console.warn("Aviso: Login anônimo desativado no console. O app tentará funcionar sem login.");
        });
      }
      // Sempre marca como pronto para permitir que o app carregue os dados
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Real-time listeners
  useEffect(() => {
    if (!isAuthReady) return;

    const handleError = (error: any, operation: string, path: string) => {
      const errInfo = {
        error: error.message,
        operation,
        path,
        auth: auth.currentUser ? 'Autenticado' : 'Não Autenticado'
      };
      console.error('Erro no Firestore:', JSON.stringify(errInfo));
    };

    const unsubDrivers = onSnapshot(collection(db, 'drivers'), 
      (snapshot) => {
        const drivers = snapshot.docs.map(doc => doc.data() as Driver).sort((a, b) => a.position - b.position);
        setState(prev => ({ ...prev, drivers, _isHydrated: true }));
      },
      (err) => handleError(err, 'list', 'drivers')
    );

    const unsubRides = onSnapshot(query(collection(db, 'rides'), orderBy('createdAt', 'desc'), limit(500)), 
      (snapshot) => {
        const rides = snapshot.docs.map(doc => doc.data() as Ride);
        setState(prev => ({ ...prev, rides }));
      },
      (err) => handleError(err, 'list', 'rides')
    );

    const unsubConfig = onSnapshot(doc(db, 'config', 'main'), 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setState(prev => ({ 
            ...prev, 
            superAdminPassword: data.superAdminPassword || 'Master123',
            alertTimestamp: data.alertTimestamp
          }));
        } else {
          setDoc(doc(db, 'config', 'main'), { superAdminPassword: 'Master123' }).catch(console.error);
        }
      },
      (err) => handleError(err, 'get', 'config/main')
    );

    return () => {
      unsubDrivers();
      unsubRides();
      unsubConfig();
    };
  }, [isAuthReady]);

  // Migration from localStorage to Firestore (one-time)
  useEffect(() => {
    if (!isAuthReady || !state._isHydrated) return;
    
    const migrate = async () => {
      const COOPTAXI_STATE_KEY = 'cooptaxi_database_v3';
      const stored = localStorage.getItem(COOPTAXI_STATE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Check if Firestore is empty before migrating
          const driverSnap = await getDocs(collection(db, 'drivers'));
          if (driverSnap.empty && parsed.drivers && parsed.drivers.length > 0) {
            console.log("Migrating data to Firestore...");
            const batch = writeBatch(db);
            
            parsed.drivers.forEach((d: Driver) => {
              batch.set(doc(db, 'drivers', d.id.toString()), d);
            });
            
            if (parsed.rides) {
              parsed.rides.forEach((r: Ride) => {
                batch.set(doc(db, 'rides', r.id), r);
              });
            }
            
            batch.set(doc(db, 'config', 'main'), {
              superAdminPassword: parsed.superAdminPassword || 'Master123',
              alertTimestamp: parsed.alertTimestamp || null
            });
            
            await batch.commit();
            localStorage.removeItem(COOPTAXI_STATE_KEY);
            console.log("Migration complete.");
          }
        } catch (e) {
          console.error("Migration failed:", e);
        }
      }
    };
    migrate();
  }, [isAuthReady, state._isHydrated]);

  const dispatch = useCallback(async (action: any) => {
    switch (action.type) {
      case 'SEND_ALERT':
        await updateDoc(doc(db, 'config', 'main'), { alertTimestamp: Date.now() });
        break;

      case 'ADD_RIDE': {
        const { specificDriverId, scheduledTime, ...ridePayload } = action.payload;
        const newRideId = new Date().toISOString();
        const createdAt = new Date().toISOString();
        
        if (scheduledTime) {
          const newRide: Ride = { 
            ...ridePayload, 
            id: newRideId, 
            status: RideStatus.SCHEDULED, 
            scheduledTime, 
            createdAt 
          };
          await setDoc(doc(db, 'rides', newRideId), newRide);
          break;
        }

        const driverToOffer = specificDriverId
          ? state.drivers.find(d => d.id === specificDriverId)
          : state.drivers.filter(d => d.isAvailable).sort((a,b) => a.position - b.position)[0];

        const newRide: Ride = { 
          ...ridePayload, 
          id: newRideId, 
          status: RideStatus.WAITING, 
          offeredToDriverId: driverToOffer?.id, 
          createdAt 
        };
        
        await setDoc(doc(db, 'rides', newRideId), newRide);
        await updateDoc(doc(db, 'config', 'main'), { alertTimestamp: Date.now() });
        break;
      }

      case 'ACCEPT_RIDE': {
        const { rideId, driverId } = action.payload;
        
        await runTransaction(db, async (transaction) => {
          const rideRef = doc(db, 'rides', rideId);
          const driverRef = doc(db, 'drivers', driverId.toString());
          
          const rideSnap = await transaction.get(rideRef);
          const driverSnap = await transaction.get(driverRef);
          
          if (!rideSnap.exists() || !driverSnap.exists()) return;
          
          const ride = rideSnap.data() as Ride;
          const driver = driverSnap.data() as Driver;
          const acceptedDriverPosition = driver.position;
          
          // Update ride
          transaction.update(rideRef, { 
            status: RideStatus.IN_PROGRESS, 
            assignedDriverId: driver.id, 
            offeredToDriverId: null 
          });
          
          // Update drivers positions
          const allDriversSnap = await getDocs(collection(db, 'drivers'));
          allDriversSnap.forEach(dDoc => {
            const d = dDoc.data() as Driver;
            if (d.id === driverId) {
              transaction.update(dDoc.ref, { position: state.drivers.length });
            } else if (d.position > acceptedDriverPosition) {
              transaction.update(dDoc.ref, { position: d.position - 1 });
            }
          });
          
          // Offer next pending ride to next available driver
          // This part is a bit tricky in a transaction without full state, 
          // but we can try to find the next available driver after positions update.
          // For simplicity, we'll let the next ADD_RIDE or manual dispatch handle it if needed,
          // or we can implement more complex logic here.
        });
        break;
      }

      case 'DECLINE_RIDE': {
        const { rideId, driverId } = action.payload;
        
        await runTransaction(db, async (transaction) => {
          const rideRef = doc(db, 'rides', rideId);
          const driverRef = doc(db, 'drivers', driverId.toString());
          
          const rideSnap = await transaction.get(rideRef);
          const driverSnap = await transaction.get(driverRef);
          
          if (!rideSnap.exists() || !driverSnap.exists()) return;
          
          const driver = driverSnap.data() as Driver;
          const declinedDriverPosition = driver.position;
          
          // Update drivers positions
          const allDriversSnap = await getDocs(collection(db, 'drivers'));
          let updatedDrivers: Driver[] = [];
          allDriversSnap.forEach(dDoc => {
            const d = dDoc.data() as Driver;
            let newPos = d.position;
            if (d.id === driverId) {
              newPos = state.drivers.length;
            } else if (d.position > declinedDriverPosition) {
              newPos = d.position - 1;
            }
            transaction.update(dDoc.ref, { position: newPos });
            updatedDrivers.push({ ...d, position: newPos });
          });
          
          const nextAvailableDriver = updatedDrivers
            .filter(d => d.isAvailable)
            .sort((a, b) => a.position - b.position)[0];
            
          transaction.update(rideRef, { offeredToDriverId: nextAvailableDriver?.id || null });
        });
        break;
      }

      case 'COMPLETE_RIDE': {
        const { rideId } = action.payload;
        const ride = state.rides.find(r => r.id === rideId);
        if (!ride || !ride.assignedDriverId) break;
        
        const batch = writeBatch(db);
        batch.update(doc(db, 'rides', rideId), { status: RideStatus.COMPLETED });
        
        const driver = state.drivers.find(d => d.id === ride.assignedDriverId);
        if (driver) {
          batch.update(doc(db, 'drivers', driver.id.toString()), {
            completedRidesIds: [...(driver.completedRidesIds || []), rideId]
          });
        }
        await batch.commit();
        break;
      }

      case 'ADD_DRIVER': {
        const { name, unitNumber, vehicleModel, password } = action.payload;
        const newId = state.drivers.length > 0 ? Math.max(...state.drivers.map(d => d.id)) + 1 : 1;
        const newPosition = state.drivers.length + 1;
        const newDriver: Driver = { 
          id: newId, 
          name, 
          unitNumber, 
          vehicleModel, 
          position: newPosition, 
          isAvailable: false, 
          password: password || '123' 
        };
        await setDoc(doc(db, 'drivers', newId.toString()), newDriver);
        break;
      }

      case 'EDIT_DRIVER':
        await updateDoc(doc(db, 'drivers', action.payload.id.toString()), action.payload);
        break;

      case 'REMOVE_DRIVER': {
        const { driverId } = action.payload;
        const driverToRemove = state.drivers.find(d => d.id === driverId);
        if (!driverToRemove) break;
        
        await runTransaction(db, async (transaction) => {
          transaction.delete(doc(db, 'drivers', driverId.toString()));
          
          const allDriversSnap = await getDocs(collection(db, 'drivers'));
          allDriversSnap.forEach(dDoc => {
            const d = dDoc.data() as Driver;
            if (d.id !== driverId && d.position > driverToRemove.position) {
              transaction.update(dDoc.ref, { position: d.position - 1 });
            }
          });
        });
        break;
      }

      case 'TOGGLE_DRIVER_AVAILABILITY': {
        const driver = state.drivers.find(d => d.id === action.payload.driverId);
        if (driver) {
          await updateDoc(doc(db, 'drivers', driver.id.toString()), { isAvailable: !driver.isAvailable });
        }
        break;
      }

      case 'DISPATCH_SCHEDULED_RIDE': {
        const ride = state.rides.find(r => r.id === action.payload.rideId);
        if (!ride || ride.status !== RideStatus.SCHEDULED) break;
        
        const driverToOffer = state.drivers
          .filter(d => d.isAvailable)
          .sort((a, b) => a.position - b.position)[0];
          
        await updateDoc(doc(db, 'rides', action.payload.rideId), { 
          status: RideStatus.WAITING, 
          offeredToDriverId: driverToOffer?.id || null 
        });
        await updateDoc(doc(db, 'config', 'main'), { alertTimestamp: Date.now() });
        break;
      }

      case 'CHANGE_SUPER_ADMIN_PASSWORD':
        await updateDoc(doc(db, 'config', 'main'), { superAdminPassword: action.payload.newPassword });
        break;

      default:
        console.warn("Unknown action type:", action.type);
    }
  }, [state.drivers, state.rides]);

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
