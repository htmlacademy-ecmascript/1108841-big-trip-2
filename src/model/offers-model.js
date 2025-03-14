import Observable from '../framework/observable.js';
import { ToClientAdapter } from '../api/adapter.js';
import { UpdateType } from '../const.js';
export default class OffersModel extends Observable {
  #offers = [];
  #apiService = null;
  #hasError = false;
  constructor(apiService) {
    super();
    this.#apiService = apiService;
  }
  async init() {
    try {
      const offers = await this.#apiService.getOffers();
      this.#offers = ToClientAdapter.convertOffers(offers);
      this.#hasError = false;
      this._notify(UpdateType.INIT);
    } catch (err) {
      this.#offers = [];
      this.#hasError = true;
      this._notify(UpdateType.ERROR);
      throw new Error('Failed to load latest route information');
    }
  }
  get offers() {
    return this.#offers;
  }
  get hasError() {
    return this.#hasError;
  }
  getOffersByType(type) {
    return this.#offers.find((offer) => offer.type === type)?.offers;
  }
}
