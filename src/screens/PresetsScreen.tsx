import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {
  TrainingPreset,
  TrainingPresetInsert,
  getTrainingPresets,
  insertTrainingPreset,
  updateTrainingPreset,
  deleteTrainingPreset,
} from '../database';
import { useTimerStore, TableType } from '../store/timerStore';

type EditingState = {
  id?: number;
  name: string;
  type: TableType;
  baseHoldSeconds: string;
  baseRestSeconds: string;
  stepSeconds: string;
  rounds: string;
};

const emptyForm: EditingState = {
  name: '',
  type: 'CO2',
  baseHoldSeconds: '60',
  baseRestSeconds: '60',
  stepSeconds: '15',
  rounds: '8',
};

export const PresetsScreen = () => {
  const [presets, setPresets] = useState<TrainingPreset[]>([]);
  const [editing, setEditing] = useState<EditingState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setConfig } = useTimerStore();

  const load = async () => {
    try {
      setLoading(true);
      const data = await getTrainingPresets();
      setPresets(data);
    } catch {
      setError('Failed to load presets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEditing = (preset?: TrainingPreset) => {
    if (!preset) {
      setEditing(emptyForm);
      return;
    }
    setEditing({
      id: preset.id,
      name: preset.name,
      type: preset.type,
      baseHoldSeconds: String(preset.base_hold_seconds),
      baseRestSeconds: String(preset.base_rest_seconds),
      stepSeconds: String(preset.step_seconds),
      rounds: String(preset.rounds),
    });
  };

  const parseForm = (): TrainingPresetInsert | null => {
    const baseHoldSeconds = parseInt(editing.baseHoldSeconds, 10);
    const baseRestSeconds = parseInt(editing.baseRestSeconds, 10);
    const stepSeconds = parseInt(editing.stepSeconds, 10);
    const rounds = parseInt(editing.rounds, 10);

    if (
      !editing.name ||
      Number.isNaN(baseHoldSeconds) ||
      Number.isNaN(baseRestSeconds) ||
      Number.isNaN(stepSeconds) ||
      Number.isNaN(rounds)
    ) {
      setError('Please fill all numeric fields correctly.');
      return null;
    }

    return {
      name: editing.name,
      type: editing.type,
      baseHoldSeconds,
      baseRestSeconds,
      stepSeconds,
      rounds,
    };
  };

  const savePreset = async () => {
    const payload = parseForm();
    if (!payload) return;

    try {
      setError(null);
      setLoading(true);
      if (editing.id) {
        await updateTrainingPreset(editing.id, payload);
      } else {
        await insertTrainingPreset(payload);
      }
      await load();
      setEditing(emptyForm);
    } catch {
      setError('Failed to save preset.');
    } finally {
      setLoading(false);
    }
  };

  const removePreset = async (id: number) => {
    try {
      setLoading(true);
      await deleteTrainingPreset(id);
      await load();
    } catch {
      setError('Failed to delete preset.');
    } finally {
      setLoading(false);
    }
  };

  const applyToTimer = (preset: TrainingPreset) => {
    setConfig({
      type: preset.type,
      baseHoldSeconds: preset.base_hold_seconds,
      baseRestSeconds: preset.base_rest_seconds,
      stepSeconds: preset.step_seconds,
      rounds: preset.rounds,
    });
  };

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-12">
      <Text className="text-2xl font-semibold text-textPrimary mb-1">
        CO₂ / O₂ presets
      </Text>
      <Text className="text-xs text-textSecondary mb-4">
        Save your favorite tables and quickly apply them to the timer.
      </Text>

      {error && (
        <Text className="text-neonYellow text-xs mb-2">{error}</Text>
      )}

      <View className="mb-6 rounded-3xl border border-slate-800 bg-surface/90 p-4">
        <Text className="text-sm text-textSecondary mb-3">
          {editing.id ? 'Edit preset' : 'New preset'}
        </Text>

        <TextInput
          placeholder="Name (e.g. CO2 warm-up)"
          placeholderTextColor="#64748b"
          value={editing.name}
          onChangeText={(text) => setEditing((s) => ({ ...s, name: text }))}
          className="text-textPrimary border border-slate-800 rounded-xl px-3 py-2 mb-3"
        />

        <View className="flex-row gap-2 mb-3">
          {(['CO2', 'O2'] as TableType[]).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setEditing((s) => ({ ...s, type }))}
              className={`flex-1 px-3 py-2 rounded-xl border ${
                editing.type === type
                  ? 'border-neonBlue bg-neonBlue/20'
                  : 'border-slate-800'
              }`}
            >
              <Text
                className={`text-center text-sm ${
                  editing.type === type ? 'text-neonBlue' : 'text-textSecondary'
                }`}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row gap-2 mb-2">
          <View className="flex-1">
            <Text className="text-xs text-textSecondary mb-1">
              Base hold (sec)
            </Text>
            <TextInput
              keyboardType="numeric"
              value={editing.baseHoldSeconds}
              onChangeText={(text) =>
                setEditing((s) => ({ ...s, baseHoldSeconds: text }))
              }
              className="text-textPrimary border border-slate-800 rounded-xl px-3 py-2"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-textSecondary mb-1">
              Base rest (sec)
            </Text>
            <TextInput
              keyboardType="numeric"
              value={editing.baseRestSeconds}
              onChangeText={(text) =>
                setEditing((s) => ({ ...s, baseRestSeconds: text }))
              }
              className="text-textPrimary border border-slate-800 rounded-xl px-3 py-2"
            />
          </View>
        </View>

        <View className="flex-row gap-2 mb-3">
          <View className="flex-1">
            <Text className="text-xs text-textSecondary mb-1">
              Step (sec)
            </Text>
            <TextInput
              keyboardType="numeric"
              value={editing.stepSeconds}
              onChangeText={(text) =>
                setEditing((s) => ({ ...s, stepSeconds: text }))
              }
              className="text-textPrimary border border-slate-800 rounded-xl px-3 py-2"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-textSecondary mb-1">Rounds</Text>
            <TextInput
              keyboardType="numeric"
              value={editing.rounds}
              onChangeText={(text) =>
                setEditing((s) => ({ ...s, rounds: text }))
              }
              className="text-textPrimary border border-slate-800 rounded-xl px-3 py-2"
            />
          </View>
        </View>

        <View className="flex-row gap-3 mt-2">
          <TouchableOpacity
            onPress={savePreset}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-full bg-neonBlue"
          >
            <Text className="text-background text-center font-semibold">
              {editing.id ? 'Save changes' : 'Create preset'}
            </Text>
          </TouchableOpacity>
          {editing.id && (
            <TouchableOpacity
              onPress={() => setEditing(emptyForm)}
              className="px-4 py-2 rounded-full border border-slate-700"
            >
              <Text className="text-textSecondary text-center font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text className="text-sm text-textSecondary mb-2">Saved presets</Text>
      {presets.length === 0 ? (
        <Text className="text-xs text-textSecondary mb-4">
          No presets yet. Create your first CO₂ or O₂ table above.
        </Text>
      ) : null}

      {presets.map((p) => (
        <View
          key={p.id}
          className="mb-3 rounded-2xl border border-slate-800 bg-surface/90 p-3"
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-textPrimary font-semibold">{p.name}</Text>
            <Text className="text-xs text-textSecondary">{p.type} table</Text>
          </View>
          <Text className="text-xs text-textSecondary mb-2">
            Hold {p.base_hold_seconds}s / Rest {p.base_rest_seconds}s · Step{' '}
            {p.step_seconds}s · {p.rounds} rounds
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => applyToTimer(p)}
              className="px-3 py-1 rounded-full bg-neonGreen"
            >
              <Text className="text-background text-xs font-semibold">
                Use in timer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => startEditing(p)}
              className="px-3 py-1 rounded-full border border-slate-700"
            >
              <Text className="text-textSecondary text-xs font-semibold">
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => removePreset(p.id)}
              className="px-3 py-1 rounded-full border border-neonRed/60"
            >
              <Text className="text-neonRed text-xs font-semibold">
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

