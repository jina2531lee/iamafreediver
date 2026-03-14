import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { getSafetyAssessment, SafetyAssessment } from '../utils/safetyLogic';

type WeatherData = {
  seaTemperature: number | null;
  windSpeed: number | null;
  swellHeight: number | null;
};

export const SafetyCard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [assessment, setAssessment] = useState<SafetyAssessment | null>(null);

  useEffect(() => {
    const fetchSafety = async () => {
      try {
        setLoading(true);
        setError(null);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission is required to compute safety.');
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});

        const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
        if (!apiKey) {
          setError('Missing OpenWeather API key (EXPO_PUBLIC_OPENWEATHER_API_KEY).');
          setLoading(false);
          return;
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&units=metric&appid=${apiKey}`;
        const res = await fetch(url);
        const json = await res.json();

        const seaTemperature =
          typeof json.main?.temp === 'number' ? json.main.temp : null;
        const windSpeed =
          typeof json.wind?.speed === 'number' ? json.wind.speed : null;

        // OpenWeather standard weather API does not include swell height directly.
        // This field is kept for future extension with marine APIs.
        const swellHeight = null;

        const w: WeatherData = {
          seaTemperature,
          windSpeed,
          swellHeight,
        };
        setWeather(w);

        const result = getSafetyAssessment({
          windSpeed: windSpeed ?? 0,
          swellHeight: swellHeight ?? 0,
        });
        setAssessment(result);
      } catch (e) {
        setError('Failed to load safety data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSafety();
  }, []);

  const borderColor =
    assessment?.level === 'Safe'
      ? 'border-neonGreen/60'
      : assessment?.level === 'Caution'
      ? 'border-neonYellow/60'
      : 'border-neonRed/60';

  const glowColor =
    assessment?.level === 'Safe'
      ? 'shadow-neonGreen/40'
      : assessment?.level === 'Caution'
      ? 'shadow-neonYellow/40'
      : 'shadow-neonRed/40';

  return (
    <View
      className={`rounded-3xl border bg-surface/90 p-5 shadow-lg ${borderColor} ${glowColor}`}
    >
      <Text className="text-sm uppercase tracking-[0.2em] text-textSecondary mb-2">
        Safety Score
      </Text>

      {loading && (
        <View className="flex-row items-center">
          <ActivityIndicator color="#22d3ee" />
          <Text className="ml-3 text-textSecondary">Analyzing conditions…</Text>
        </View>
      )}

      {!loading && error && (
        <Text className="text-neonYellow text-sm">{error}</Text>
      )}

      {!loading && !error && assessment && (
        <>
          <View className="flex-row items-baseline mb-3">
            <Text className="text-3xl font-semibold text-textPrimary mr-2">
              {assessment.level}
            </Text>
            <Text className="text-xs text-textSecondary">
              {assessment.color.toUpperCase()}
            </Text>
          </View>
          <Text className="text-sm text-textSecondary mb-4">
            {assessment.message}
          </Text>

          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs text-textSecondary mb-1">Wind</Text>
              <Text className="text-base text-textPrimary">
                {weather?.windSpeed != null
                  ? `${weather.windSpeed.toFixed(1)} m/s`
                  : '--'}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-textSecondary mb-1">Sea temp</Text>
              <Text className="text-base text-textPrimary">
                {weather?.seaTemperature != null
                  ? `${weather.seaTemperature.toFixed(1)} °C`
                  : '--'}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-textSecondary mb-1">Swell</Text>
              <Text className="text-base text-textPrimary">
                {weather?.swellHeight != null
                  ? `${weather.swellHeight.toFixed(1)} m`
                  : 'n/a'}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

