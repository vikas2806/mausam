/**
 * Base abstract interface for Weather Data Providers.
 */
export class WeatherDataProvider {
  /**
   * Fetch normalized weather dataset for a specific location.
   * @param {string} locationId
   * @returns {Promise<import('./types').NormalizedWeatherData>}
   */
  async getWeatherData(locationId) {
    throw new Error('getWeatherData method must be implemented by concrete Provider subclass.');
  }

  /**
   * Search available locations by query string.
   * @param {string} query
   * @returns {Promise<import('./types').LocationInfo[]>}
   */
  async searchLocations(query) {
    throw new Error('searchLocations method must be implemented by concrete Provider subclass.');
  }
}
