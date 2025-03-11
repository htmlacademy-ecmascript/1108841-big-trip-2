import { adaptToClient } from '../api/adapter.js';

export default class OffersModel {
  #offers = [];
  #apiService = null;

  constructor(apiService) {
    this.#apiService = apiService;
  }

  async init() {
    try {
      const offers = await this.#apiService.getOffers();
      this.#offers = adaptToClient.convertOffers(offers);
    } catch (err) {
      this.#offers = [];
      throw new Error('Не удалось загрузить предложения');
    }
  }

  get offers() {
    return this.#offers;
  }

  getOffersByType(type) {
    return this.#offers.find((offer) => offer.type === type)?.offers;
  }
}
