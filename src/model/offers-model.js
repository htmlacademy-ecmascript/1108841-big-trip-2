export default class OffersModel {
  constructor(service) {
    this.offers = service.offers;
  }

  getOffersByType(type) {
    return this.offers.find((offer) => offer.type === type)?.offers;
  }
}
