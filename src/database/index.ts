import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { nowUtcIso } from '../utils/dateFormatter';

type WebLikeResultSet = {
  rows: {
    length: number;
    item: (index: number) => any;
  };
};

type WebLikeTx = {
  executeSql: (
    query: string,
    params?: any[],
    onSuccess?: (_: any, result: WebLikeResultSet) => void,
    onError?: (error: any) => void
  ) => void;
};

type WebLikeDb = {
  transaction: (
    fn: (tx: WebLikeTx) => void,
    onError?: (error: any) => void,
    onSuccess?: () => void
  ) => void;
};

const createWebMockDb = (): WebLikeDb => ({
  transaction: (fn, onError, onSuccess) => {
    try {
      const tx: WebLikeTx = {
        executeSql: (_query, _params, onSuccessRow) => {
          if (onSuccessRow) {
            const empty: WebLikeResultSet = {
              rows: {
                length: 0,
                item: () => ({}),
              },
            };
            onSuccessRow(null, empty);
          }
        },
      };
      fn(tx);
      if (onSuccess) onSuccess();
    } catch (e) {
      if (onError) onError(e);
    }
  },
});

const db: SQLite.SQLiteDatabase | WebLikeDb =
  Platform.OS === 'web' || typeof (SQLite as any).openDatabase !== 'function'
    ? createWebMockDb()
    : (SQLite as any).openDatabase('deeplog.db');

export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // dive_logs: depth / duration / temp / JSON dive profile
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS dive_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            max_depth REAL,
            duration_seconds INTEGER,
            water_temp REAL,
            profile_data TEXT,
            created_at_utc TEXT NOT NULL
          );`
        );

        // static_sessions: breath-hold results (including CO2/O2 tables) summary
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS static_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT, -- e.g. 'CO2' or 'O2'
            max_hold_seconds INTEGER,
            total_hold_seconds INTEGER,
            total_rest_seconds INTEGER,
            sets_completed INTEGER,
            notes TEXT,
            created_at_utc TEXT NOT NULL
          );`
        );

        // training_presets: configurable CO2/O2 tables
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS training_presets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL, -- 'CO2' or 'O2'
            base_hold_seconds INTEGER NOT NULL,
            base_rest_seconds INTEGER NOT NULL,
            step_seconds INTEGER NOT NULL,
            rounds INTEGER NOT NULL,
            created_at_utc TEXT NOT NULL
          );`
        );
      },
      (error) => reject(error),
      () => resolve()
    );
  });
};

export type StaticSessionInsert = {
  type: 'CO2' | 'O2';
  maxHoldSeconds: number;
  totalHoldSeconds: number;
  totalRestSeconds: number;
  setsCompleted: number;
  notes?: string | null;
};

export const insertStaticSession = (
  payload: StaticSessionInsert
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `INSERT INTO static_sessions 
            (type, max_hold_seconds, total_hold_seconds, total_rest_seconds, sets_completed, notes, created_at_utc) 
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            payload.type,
            payload.maxHoldSeconds,
            payload.totalHoldSeconds,
            payload.totalRestSeconds,
            payload.setsCompleted,
            payload.notes ?? null,
            nowUtcIso(),
          ]
        );
      },
      (error) => reject(error),
      () => resolve()
    );
  });
};

export const getDbInstance = () => db;

export type TrainingPreset = {
  id: number;
  name: string;
  type: 'CO2' | 'O2';
  base_hold_seconds: number;
  base_rest_seconds: number;
  step_seconds: number;
  rounds: number;
  created_at_utc: string;
};

export type TrainingPresetInsert = {
  name: string;
  type: 'CO2' | 'O2';
  baseHoldSeconds: number;
  baseRestSeconds: number;
  stepSeconds: number;
  rounds: number;
};

export const getTrainingPresets = (): Promise<TrainingPreset[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql<TrainingPreset>(
          `SELECT * FROM training_presets ORDER BY created_at_utc DESC;`,
          [],
          (_, result) => {
            const rows: TrainingPreset[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              rows.push(result.rows.item(i));
            }
            resolve(rows);
          }
        );
      },
      (error) => reject(error)
    );
  });
};

export const insertTrainingPreset = (
  payload: TrainingPresetInsert
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `INSERT INTO training_presets 
            (name, type, base_hold_seconds, base_rest_seconds, step_seconds, rounds, created_at_utc)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            payload.name,
            payload.type,
            payload.baseHoldSeconds,
            payload.baseRestSeconds,
            payload.stepSeconds,
            payload.rounds,
            nowUtcIso(),
          ]
        );
      },
      (error) => reject(error),
      () => resolve()
    );
  });
};

export const updateTrainingPreset = (
  id: number,
  payload: TrainingPresetInsert
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `UPDATE training_presets
           SET name = ?, type = ?, base_hold_seconds = ?, base_rest_seconds = ?, step_seconds = ?, rounds = ?
           WHERE id = ?;`,
          [
            payload.name,
            payload.type,
            payload.baseHoldSeconds,
            payload.baseRestSeconds,
            payload.stepSeconds,
            payload.rounds,
            id,
          ]
        );
      },
      (error) => reject(error),
      () => resolve()
    );
  });
};

export const deleteTrainingPreset = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(`DELETE FROM training_presets WHERE id = ?;`, [id]);
      },
      (error) => reject(error),
      () => resolve()
    );
  });
};


