import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';
import { getDbInstance } from '../database';
import { formatLocalFromUtc, getLocalDateKeyFromUtc } from '../utils/dateFormatter';

type SessionRow = {
  id: number;
  max_hold_seconds: number;
  total_hold_seconds: number;
  created_at_utc: string;
};

export const AnalysisScreen = () => {
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    const load = () => {
      const db = getDbInstance();
      const since = new Date();
      since.setMonth(since.getMonth() - 1);
      const sinceIso = since.toISOString();

      db.transaction((tx) => {
        tx.executeSql<
          SessionRow
        >(
          `SELECT id, max_hold_seconds, total_hold_seconds, created_at_utc
           FROM static_sessions
           WHERE created_at_utc >= ?
           ORDER BY created_at_utc ASC;`,
          [sinceIso],
          (_, result) => {
            const rows: SessionRow[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              rows.push(result.rows.item(i));
            }
            setSessions(rows);
          }
        );
      });
    };

    load();
  }, []);

  const pbByDate = (() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      const key = getLocalDateKeyFromUtc(s.created_at_utc);
      const current = map.get(key) ?? 0;
      map.set(key, Math.max(current, s.max_hold_seconds));
    });
    return Array.from(map.entries()).map(([date, pb]) => ({
      x: date,
      y: pb,
    }));
  })();

  const totalSessions = sessions.length;
  const totalHoldSeconds = sessions.reduce(
    (sum, s) => sum + (s.total_hold_seconds ?? 0),
    0
  );

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-12">
      <Text className="text-2xl font-semibold text-textPrimary mb-1">
        Analysis
      </Text>
      <Text className="text-xs text-textSecondary mb-6">
        Last 30 days of training, shown in your local time.
      </Text>

      <View className="mb-6">
        <Text className="text-sm text-textSecondary mb-2">
          Chart 1 · Max breath-hold over time
        </Text>
        <View className="rounded-3xl border border-cyan-500/40 bg-surface/80 p-3">
          {pbByDate.length === 0 ? (
            <Text className="text-textSecondary text-sm">
              No static sessions recorded yet. Finish a CO₂/O₂ table to see your
              progression.
            </Text>
          ) : (
            <VictoryChart
              theme={VictoryTheme.material}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
            >
              <VictoryLine
                interpolation="monotoneX"
                style={{
                  data: { stroke: '#22d3ee', strokeWidth: 3 },
                }}
                data={pbByDate}
              />
            </VictoryChart>
          )}
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-sm text-textSecondary mb-2">
          Chart 2 · Monthly stats
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-neonBlue/50 bg-surface/80 p-4">
            <Text className="text-xs text-textSecondary mb-1">
              Sessions (30d)
            </Text>
            <Text className="text-2xl font-semibold text-neonBlue">
              {totalSessions}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border border-neonGreen/50 bg-surface/80 p-4">
            <Text className="text-xs text-textSecondary mb-1">
              Total hold time
            </Text>
            <Text className="text-2xl font-semibold text-neonGreen">
              {(totalHoldSeconds / 60).toFixed(1)} min
            </Text>
          </View>
        </View>
      </View>

      {sessions.length > 0 && (
        <View className="mt-4 mb-8">
          <Text className="text-sm text-textSecondary mb-2">
            Recent sessions
          </Text>
          {sessions.slice(-5).map((s) => (
            <View
              key={s.id}
              className="mb-2 rounded-2xl border border-slate-800 bg-surface/90 p-3"
            >
              <Text className="text-textPrimary text-sm mb-1">
                PB {s.max_hold_seconds}s
              </Text>
              <Text className="text-xs text-textSecondary">
                {formatLocalFromUtc(s.created_at_utc)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

