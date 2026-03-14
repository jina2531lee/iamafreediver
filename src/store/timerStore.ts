import { create } from 'zustand';
import { insertStaticSession } from '../database';

export type TableType = 'CO2' | 'O2';

export type TimerPhase = 'idle' | 'prepare' | 'hold' | 'rest' | 'finished';

type TimerConfig = {
  type: TableType;
  rounds: number;
  baseHoldSeconds: number;
  baseRestSeconds: number;
  stepSeconds: number; // 15 seconds as described
};

type TimerState = {
  config: TimerConfig;
  currentRound: number;
  phase: TimerPhase;
  secondsRemaining: number;
  running: boolean;
  totalHoldSeconds: number;
  totalRestSeconds: number;
  maxHoldSeconds: number;
};

type TimerActions = {
  setConfig: (config: Partial<TimerConfig>) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => Promise<void>;
};

const CO2_DEFAULT: TimerConfig = {
  type: 'CO2',
  rounds: 8,
  baseHoldSeconds: 60,
  baseRestSeconds: 60,
  stepSeconds: 15,
};

export const useTimerStore = create<TimerState & TimerActions>((set, get) => ({
  config: CO2_DEFAULT,
  currentRound: 0,
  phase: 'idle',
  secondsRemaining: 0,
  running: false,
  totalHoldSeconds: 0,
  totalRestSeconds: 0,
  maxHoldSeconds: 0,

  setConfig: (partial) =>
    set((state) => ({
      config: { ...state.config, ...partial },
    })),

  start: () => {
    const { phase, config, currentRound } = get();
    if (phase === 'idle' || phase === 'finished') {
      set({
        phase: 'prepare',
        currentRound: 1,
        secondsRemaining: 10,
        running: true,
        totalHoldSeconds: 0,
        totalRestSeconds: 0,
        maxHoldSeconds: 0,
      });
    } else if (!get().running) {
      set({ running: true });
    }
  },

  pause: () => set({ running: false }),

  reset: () =>
    set({
      currentRound: 0,
      phase: 'idle',
      secondsRemaining: 0,
      running: false,
      totalHoldSeconds: 0,
      totalRestSeconds: 0,
      maxHoldSeconds: 0,
    }),

  tick: async () => {
    const state = get();
    if (!state.running || state.phase === 'idle' || state.phase === 'finished') {
      return;
    }

    if (state.secondsRemaining > 1) {
      // Decrement within current phase
      set({ secondsRemaining: state.secondsRemaining - 1 });
      if (state.phase === 'hold') {
        set((s) => ({
          totalHoldSeconds: s.totalHoldSeconds + 1,
          maxHoldSeconds: Math.max(
            s.maxHoldSeconds,
            s.totalHoldSeconds + 1 // approximate max within current set
          ),
        }));
      }
      if (state.phase === 'rest') {
        set((s) => ({ totalRestSeconds: s.totalRestSeconds + 1 }));
      }
      return;
    }

    // Phase transition
    const { config } = state;
    const isLastRound = state.currentRound >= config.rounds;

    // Determine next phase and timings for CO2/O2 logic
    if (state.phase === 'prepare' || state.phase === 'rest') {
      // Move into hold
      const holdBase = config.baseHoldSeconds;
      const restBase = config.baseRestSeconds;
      const step = config.stepSeconds;

      let holdSeconds = holdBase;
      let restSeconds = restBase;

      if (config.type === 'CO2') {
        // CO2: hold fixed, rest decreases by 15s each round
        holdSeconds = holdBase;
        restSeconds = Math.max(restBase - step * (state.currentRound - 1), step);
      } else {
        // O2: rest fixed, hold increases by 15s each round
        restSeconds = restBase;
        holdSeconds = holdBase + step * (state.currentRound - 1);
      }

      set({
        phase: 'hold',
        secondsRemaining: holdSeconds,
      });
      return;
    }

    if (state.phase === 'hold') {
      if (isLastRound) {
        // Training finished, persist summary
        await insertStaticSession({
          type: config.type,
          maxHoldSeconds: state.maxHoldSeconds,
          totalHoldSeconds: state.totalHoldSeconds,
          totalRestSeconds: state.totalRestSeconds,
          setsCompleted: state.currentRound,
        });

        set({
          phase: 'finished',
          running: false,
          secondsRemaining: 0,
        });
        return;
      }

      // Move to rest between sets
      const restBase = config.baseRestSeconds;
      const step = config.stepSeconds;

      let restSeconds = restBase;
      if (config.type === 'CO2') {
        restSeconds = Math.max(
          restBase - step * (state.currentRound - 1),
          step
        );
      } else {
        restSeconds = restBase;
      }

      set({
        phase: 'rest',
        secondsRemaining: restSeconds,
        currentRound: state.currentRound + 1,
      });
      return;
    }
  },
}));

