import { PrayerTimes, PrayerTimesCalendarApiResponse, QiblaApiResponse } from '../types';

/**
 * Gets the user's current geographical coordinates.
 * @returns A promise that resolves to an object with latitude and longitude.
 * @throws An error if location permission is denied or unavailable.
 */
export const getUserLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Location access was denied. Please enable it in your browser settings to see prayer times."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable."));
            break;
          case error.TIMEOUT:
            reject(new Error("The request to get user location timed out."));
            break;
          default:
            reject(new Error("An unknown error occurred while fetching location."));
            break;
        }
      }
    );
  });
};

/**
 * Fetches prayer times for a given date and coordinates from the Aladhan API using the calendar endpoint.
 * @param coordinates - An object with the user's latitude and longitude.
 * @returns A promise that resolves to a PrayerTimes object for the current day.
 */
export const getPrayerTimes = async (coordinates: { latitude: number; longitude: number }): Promise<PrayerTimes> => {
  try {
    const { latitude, longitude } = coordinates;
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const method = 2; // ISNA (Islamic Society of North America)

    const response = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${latitude}&longitude=${longitude}&method=${method}&month=${month}&year=${year}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PrayerTimesCalendarApiResponse = await response.json();

    if (data.code === 200 && data.data && data.data.length > 0) {
      const todayData = data.data[date.getDate() - 1]; // Array is 0-indexed, getDate() is 1-indexed
      if (!todayData || !todayData.timings) {
        throw new Error("Prayer time data for today is missing in the API response.");
      }
      const { Fajr, Dhuhr, Asr, Maghrib, Isha } = todayData.timings;
      return { Fajr, Dhuhr, Asr, Maghrib, Isha };
    } else {
      throw new Error(data.status || "Invalid API response for prayer times.");
    }
  } catch (error) {
    console.error("Failed to fetch prayer times:", error);
    if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) {
        throw new Error("Could not load prayer times. Please check your internet connection.");
    }
    throw new Error("An unexpected error occurred while loading prayer times.");
  }
};


/**
 * Fetches the Qibla direction from the user's current location.
 * @param latitude The user's latitude.
 * @param longitude The user's longitude.
 * @returns A promise that resolves to the Qibla direction in degrees.
 */
export const getQiblaDirection = async (latitude: number, longitude: number): Promise<number> => {
    try {
        const response = await fetch(`https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: QiblaApiResponse = await response.json();
        if (data.code === 200 && data.data) {
            return data.data.direction;
        } else {
            throw new Error(data.status || "Invalid API response for Qibla direction.");
        }
    } catch (error) {
        console.error("Failed to fetch Qibla direction:", error);
        throw new Error("Could not load the Qibla direction from the server.");
    }
};