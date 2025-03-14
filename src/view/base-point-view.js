import AbstractView from '../framework/view/abstract-view.js';

export default class BasePointView extends AbstractView {
  #point = null;
  #destinations = null;
  #offers = null;

  constructor({ point, destinations, offers }) {
    super();
    this.#point = point;
    this.#destinations = destinations;
    this.#offers = offers;
  }

  get point() {
    return this.#point;
  }

  get destinations() {
    return this.#destinations;
  }

  get offers() {
    return this.#offers;
  }

  getDestinationById(id) {
    return this.#destinations.find((dest) => dest.id === id);
  }

  getOffersByType(type) {
    return this.#offers.find((offer) => offer.type === type)?.offers || [];
  }

  getSelectedOffers(pointOffers, typeOffers) {
    return typeOffers.filter((offer) => pointOffers.includes(offer.id));
  }
}
