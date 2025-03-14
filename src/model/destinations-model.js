import Observable from '../framework/observable.js';
import { UpdateType } from '../const.js';

export default class DestinationsModel extends Observable {
  #destinations = [];
  #apiService = null;
  #hasError = false;

  constructor(apiService) {
    super();
    this.#apiService = apiService;
  }

  async init() {
    try {
      const destinations = await this.#apiService.destinations;
      this.#destinations = destinations;
      this.#hasError = false;
      this._notify(UpdateType.INIT);
    } catch (err) {
      this.#destinations = [];
      this.#hasError = true;
      this._notify(UpdateType.ERROR);
      throw new Error('Failed to load latest route information');
    }
  }

  get destinations() {
    return this.#destinations;
  }

  get hasError() {
    return this.#hasError;
  }

  getById(id) {
    return this.#destinations.find((destination) => destination.id === id);
  }
}
