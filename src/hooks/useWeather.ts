import { useState, useEffect, useRef, useCallback } from 'react';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  city: string;
  loading: boolean;
  error: boolean;
}

function getWeatherIcon(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? 'ri-sun-line' : 'ri-moon-line';
  if (code === 1) return isDay ? 'ri-sun-cloudy-line' : 'ri-moon-cloudy-line';
  if (code === 2) return 'ri-cloudy-line';
  if (code === 3) return 'ri-cloudy-2-line';
  if (code === 45 || code === 48) return 'ri-mist-line';
  if (code >= 51 && code <= 55) return 'ri-drizzle-line';
  if (code >= 56 && code <= 57) return 'ri-hail-line';
  if (code >= 61 && code <= 65) return 'ri-rainy-line';
  if (code >= 66 && code <= 67) return 'ri-hail-line';
  if (code >= 71 && code <= 77) return 'ri-snowy-line';
  if (code >= 80 && code <= 82) return 'ri-showers-line';
  if (code >= 85 && code <= 86) return 'ri-snowy-line';
  if (code >= 95 && code <= 99) return 'ri-thunderstorms-line';
  return isDay ? 'ri-sun-line' : 'ri-moon-line';
}

const WARSAW_LAT = 52.2297;
const WARSAW_LON = 21.0122;
const REFRESH_INTERVAL = 10 * 60 * 1000;

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 0,
    weatherCode: 0,
    isDay: true,
    city: 'Warszawa',
    loading: true,
    error: false,
  });
  const successRef = useRef(false);

  const fetchWeather = useCallback(async (lat: number, lon: number, cityName: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
        { signal: controller.signal },
      );
      clearTimeout(timeout);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      const cw = data.current_weather;
      if (cw) {
        successRef.current = true;
        setWeather({
          temperature: Math.round(cw.temperature),
          weatherCode: cw.weathercode,
          isDay: cw.is_day === 1,
          city: cityName,
          loading: false,
          error: false,
        });
      }
    } catch {
      setWeather((prev) => ({
        ...prev,
        city: cityName,
        loading: false,
        error: !successRef.current,
      }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const initWeather = async () => {
      const lat = WARSAW_LAT;
      const lon = WARSAW_LON;
      const cityName = 'Warszawa';

      if (!cancelled) {
        await fetchWeather(lat, lon, cityName);

        intervalId = setInterval(() => {
          fetchWeather(lat, lon, cityName);
        }, REFRESH_INTERVAL);
      }
    };

    initWeather();

    return () => {
      cancelled = true;
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [fetchWeather]);

  const icon = getWeatherIcon(weather.weatherCode, weather.isDay);

  return { ...weather, icon };
}