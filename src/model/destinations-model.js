import { adaptToClient } from '../api/adapter.js';

export default class DestinationsModel {
  #destinations = [];
  #apiService = null;

  constructor(apiService) {
    this.#apiService = apiService;
  }

  async init() {
    try {
      const destinations = await this.#apiService.getDestinations();
      this.#destinations = adaptToClient.destinations(destinations);
    } catch (err) {
      this.#destinations = [];
      throw new Error('Не удалось загрузить пункты назначения');
    }
  }

  get destinations() {
    return this.#destinations;
  }

  getById(id) {
    return this.#destinations.find((destination) => destination.id === id);
  }
}
