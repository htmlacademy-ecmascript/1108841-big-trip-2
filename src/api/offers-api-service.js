import ApiService from '../framework/api-service.js';

export default class OffersApiService extends ApiService {
  constructor(endPoint, authorization) {
    super(endPoint, authorization);
  }

  get offers() {
    return this._load({ url: 'offers' })
      .then(ApiService.parseResponse)
      .then((offers) => offers.map((offerGroup) => this.#adaptOfferGroupToClient(offerGroup)));
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
