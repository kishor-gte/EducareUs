import axios from 'axios';
import { State, City } from 'country-state-city';
import { env } from '../config/env.js';

// In-memory cache to optimize performance and prevent rate-limit hits
let cachedStates = null;
const cachedCitiesByState = new Map();

export class LocationService {
  /**
   * Fetch all States and Union Territories of India (IN)
   */
  static async getStates() {
    if (cachedStates && cachedStates.length > 0) {
      return cachedStates;
    }

    // 1. Try fetching from live CountryStateCity API if API key is provided
    if (env.CSC_API_KEY && env.CSC_API_KEY.trim() !== '') {
      try {
        const response = await axios.get('https://api.countrystatecity.in/v1/countries/IN/states', {
          headers: {
            'X-CSCAPI-KEY': env.CSC_API_KEY.trim(),
          },
          timeout: 5000,
        });

        if (Array.isArray(response.data) && response.data.length > 0) {
          const formatted = response.data
            .map((s) => ({
              name: s.name,
              isoCode: s.iso2 || s.isoCode,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          cachedStates = formatted;
          return formatted;
        }
      } catch (err) {
        console.warn(
          '⚠️ Live CountryStateCity API request failed, falling back to dynamic country-state-city dataset:',
          err.message
        );
      }
    }

    // 2. Dynamic, comprehensive dataset via official country-state-city package
    const states = State.getStatesOfCountry('IN');
    const formatted = states
      .map((s) => ({
        name: s.name,
        isoCode: s.isoCode,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    cachedStates = formatted;
    return formatted;
  }

  /**
   * Fetch all cities for a specific state in India by state code (e.g., 'UP', 'MH', 'KA')
   */
  static async getCitiesByState(stateCode) {
    if (!stateCode) return [];

    const normalizedCode = stateCode.trim().toUpperCase();

    if (cachedCitiesByState.has(normalizedCode)) {
      return cachedCitiesByState.get(normalizedCode);
    }

    // 1. Try fetching from live CountryStateCity API if API key is provided
    if (env.CSC_API_KEY && env.CSC_API_KEY.trim() !== '') {
      try {
        const response = await axios.get(
          `https://api.countrystatecity.in/v1/countries/IN/states/${normalizedCode}/cities`,
          {
            headers: {
              'X-CSCAPI-KEY': env.CSC_API_KEY.trim(),
            },
            timeout: 5000,
          }
        );

        if (Array.isArray(response.data) && response.data.length > 0) {
          const formatted = response.data
            .map((c) => ({
              name: c.name,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          cachedCitiesByState.set(normalizedCode, formatted);
          return formatted;
        }
      } catch (err) {
        console.warn(
          `⚠️ Live CountryStateCity API request for state ${normalizedCode} failed, falling back to dynamic dataset:`,
          err.message
        );
      }
    }

    // 2. Dynamic dataset via official country-state-city package (covers all Indian cities)
    const cities = City.getCitiesOfState('IN', normalizedCode);
    const formatted = cities
      .map((c) => ({
        name: c.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    cachedCitiesByState.set(normalizedCode, formatted);
    return formatted;
  }
}
