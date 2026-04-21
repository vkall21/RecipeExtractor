import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MeasurementSystem } from '../utils/unitConverter';

const STORAGE_KEY = '@measurementSystem';

interface MeasurementContextValue {
  system: MeasurementSystem;
  setSystem: (s: MeasurementSystem) => void;
}

const MeasurementContext = createContext<MeasurementContextValue>({
  system: 'imperial',
  setSystem: () => {},
});

export function MeasurementProvider({ children }: { children: React.ReactNode }) {
  const [system, setSystemState] = useState<MeasurementSystem>('imperial');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'metric' || val === 'imperial') setSystemState(val);
    });
  }, []);

  function setSystem(s: MeasurementSystem) {
    setSystemState(s);
    AsyncStorage.setItem(STORAGE_KEY, s);
  }

  return (
    <MeasurementContext.Provider value={{ system, setSystem }}>
      {children}
    </MeasurementContext.Provider>
  );
}

export function useMeasurement() {
  return useContext(MeasurementContext);
}
