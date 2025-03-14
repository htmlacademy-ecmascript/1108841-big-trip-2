import BaseDataModel from './base-data-model.js';

export default class OffersModel extends BaseDataModel {
  constructor(apiService) {
    super(apiService, 'offers');
  }

  get offers() {
    return this.data;
  }

  getOffersByType(type) {
    return this.offers.find((offer) => offer.type === type)?.offers;
  }
}
