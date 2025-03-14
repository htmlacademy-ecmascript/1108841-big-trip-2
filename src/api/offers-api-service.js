import BaseApiService from './base-api-service.js';

export default class OffersApiService extends BaseApiService {
  constructor(endPoint, authorization) {
    super(endPoint, authorization, 'offers');
  }

  get offers() {
    return this.data;
  }

  adaptDataToClient(offers) {
    return offers.map((offerGroup) => this.#adaptOfferGroupToClient(offerGroup));
  }

  #adaptOfferGroupToClient(offerGroup) {
    return {
      type: offerGroup.type,
      offers: offerGroup.offers.map((offer) => this.#adaptOfferToClient(offer))
    };
  }

  #adaptOfferToClient(offer) {
    return {
      id: offer.id,
      title: offer.title,
      price: offer.price
    };
  }
}
