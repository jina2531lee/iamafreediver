import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useTimerStore } from '../store/timerStore';
import * as Haptics from 'expo-haptics';

export const TimerScreen = () => {
  const {
    config,
    currentRound,
    phase,
    secondsRemaining,
    running,
    start,
    pause,
    reset,
    tick,
    setConfig,
  } = useTimerStore();

  const [localType, setLocalType] = useState(config.type);
  const [localBaseHold, setLocalBaseHold] = useState(
    String(config.baseHoldSeconds)
  );
  const [localBaseRest, setLocalBaseRest] = useState(
    String(config.baseRestSeconds)
  );
  const [localStep, setLocalStep] = useState(String(config.stepSeconds));
  const [localRounds, setLocalRounds] = useState(String(config.rounds));

  const applyTableConfig = () => {
    const baseHold = parseInt(localBaseHold, 10);
    const baseRest = parseInt(localBaseRest, 10);
    const step = parseInt(localStep, 10);
    const rounds = parseInt(localRounds, 10);

    if (
      Number.isNaN(baseHold) ||
      Number.isNaN(baseRest) ||
      Number.isNaN(step) ||
      Number.isNaN(rounds)
    ) {
      return;
    }

    setConfig({
      type: localType,
      baseHoldSeconds: baseHold,
      baseRestSeconds: baseRest,
      stepSeconds: step,
      rounds,
    });
  };

  const tablePreview = () => {
    const baseHold = parseInt(localBaseHold, 10);
    const baseRest = parseInt(localBaseRest, 10);
    const step = parseInt(localStep, 10);
    const rounds = parseInt(localRounds, 10);

    if (
      Number.isNaN(baseHold) ||
      Number.isNaN(baseRest) ||
      Number.isNaN(step) ||
      Number.isNaN(rounds)
    ) {
      return [];
    }

    const rows: { round: number; hold: number; rest: number }[] = [];

    for (let r = 1; r <= rounds; r++) {
      let hold = baseHold;
      let rest = baseRest;

      if (localType === 'CO2') {
        hold = baseHold;
        rest = Math.max(baseRest - step * (r - 1), step);
      } else {
        // O2 table
        hold = baseHold + step * (r - 1);
        rest = baseRest;
      }

      rows.push({ round: r, hold, rest });
    }

    return rows;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (running) {
      interval = setInterval(async () => {
        const prevPhase = phase;
        await tick();
        if (prevPhase !== useTimerStore.getState().phase) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [running, tick, phase]);

  const formattedSeconds = (total: number) => {
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(total % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#020617',
        paddingHorizontal: 16,
        paddingTop: 48,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: '600',
          color: '#e5e7eb',
          marginBottom: 4,
        }}
      >
        Training table
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: '#9ca3af',
          marginBottom: 16,
        }}
      >
        Set up your CO₂ / O₂ table first, then start the timer.
      </Text>

      {/* Table settings */}
      <View
        style={{
          borderWidth: 1,
          borderColor: '#1f2937',
          borderRadius: 20,
          padding: 12,
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: '#9ca3af',
            marginBottom: 8,
          }}
        >
          Table type
        </Text>
        <View
          style={{
            flexDirection: 'row',
            columnGap: 8,
            marginBottom: 12,
          }}
        >
          {(['CO2', 'O2'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setLocalType(type)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor:
                  localType === type ? '#22d3ee' : 'rgba(55,65,81,1)',
                backgroundColor:
                  localType === type ? 'rgba(34,211,238,0.15)' : 'transparent',
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  color: localType === type ? '#22d3ee' : '#9ca3af',
                }}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={{
            flexDirection: 'row',
            columnGap: 8,
            marginBottom: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}
            >
              Base hold (sec)
            </Text>
            <TextInput
              keyboardType="numeric"
              value={localBaseHold}
              onChangeText={setLocalBaseHold}
              onEndEditing={applyTableConfig}
              style={{
                borderWidth: 1,
                borderColor: '#1f2937',
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 4,
                color: '#e5e7eb',
                fontSize: 12,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}
            >
              Base rest (sec)
            </Text>
            <TextInput
              keyboardType="numeric"
              value={localBaseRest}
              onChangeText={setLocalBaseRest}
              onEndEditing={applyTableConfig}
              style={{
                borderWidth: 1,
                borderColor: '#1f2937',
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 4,
                color: '#e5e7eb',
                fontSize: 12,
              }}
            />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            columnGap: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}
            >
              Step (sec)
            </Text>
            <TextInput
              keyboardType="numeric"
              value={localStep}
              onChangeText={setLocalStep}
              onEndEditing={applyTableConfig}
              style={{
                borderWidth: 1,
                borderColor: '#1f2937',
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 4,
                color: '#e5e7eb',
                fontSize: 12,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}
            >
              Rounds
            </Text>
            <TextInput
              keyboardType="numeric"
              value={localRounds}
              onChangeText={setLocalRounds}
              onEndEditing={applyTableConfig}
              style={{
                borderWidth: 1,
                borderColor: '#1f2937',
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 4,
                color: '#e5e7eb',
                fontSize: 12,
              }}
            />
          </View>
        </View>
      </View>

      {/* Final table preview */}
      <View
        style={{
          borderWidth: 1,
          borderColor: '#1f2937',
          borderRadius: 20,
          padding: 12,
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: '#9ca3af',
            marginBottom: 8,
          }}
        >
          Final table preview (per round)
        </Text>
        {tablePreview().length === 0 ? (
          <Text style={{ fontSize: 12, color: '#6b7280' }}>
            Enter valid numbers above to see the table.
          </Text>
        ) : (
          tablePreview().map((row) => (
            <View
              key={row.round}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: '#e5e7eb' }}>
                #{row.round}
              </Text>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                Hold {row.hold}s · Rest {row.rest}s
              </Text>
            </View>
          ))
        )}
      </View>

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: '#9ca3af',
            marginBottom: 8,
            letterSpacing: 3,
          }}
        >
          {phase === 'idle' ? 'READY' : phase.toUpperCase()}
        </Text>
        <Text
          style={{
            fontSize: 56,
            fontWeight: '700',
            color: '#22d3ee',
            marginBottom: 16,
          }}
        >
          {formattedSeconds(secondsRemaining || 0)}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#9ca3af',
            marginBottom: 24,
          }}
        >
          Round {currentRound}/{config.rounds}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            columnGap: 16,
            marginTop: 16,
          }}
        >
          {!running && phase !== 'finished' && (
            <TouchableOpacity
              onPress={start}
              style={{
                paddingHorizontal: 32,
                paddingVertical: 12,
                borderRadius: 999,
                backgroundColor: '#22d3ee',
              }}
            >
              <Text
                style={{
                  color: '#020617',
                  fontWeight: '600',
                }}
              >
                Start
              </Text>
            </TouchableOpacity>
          )}
          {running && (
            <TouchableOpacity
              onPress={pause}
              style={{
                paddingHorizontal: 32,
                paddingVertical: 12,
                borderRadius: 999,
                backgroundColor: '#eab308',
              }}
            >
              <Text
                style={{
                  color: '#020617',
                  fontWeight: '600',
                }}
              >
                Pause
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={reset}
            style={{
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: '#1f2937',
            }}
          >
            <Text
              style={{
                color: '#9ca3af',
                fontWeight: '600',
              }}
            >
              Reset
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

