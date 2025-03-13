import TripInfoView from '../view/trip-info-view.js';
import { render, replace, remove } from '../utils/render-utils.js';

export default class TripInfoPresenter {
  #container = null;
  #tripsModel = null;
  #destinationsModel = null;
  #offersModel = null;
  #tripInfoComponent = null;

  constructor({ container, tripsModel, destinationsModel, offersModel }) {
    this.#container = container;
    this.#tripsModel = tripsModel;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;

    this.#tripsModel.addObserver(this.#handleModelEvent);
  }

  init() {
    const prevTripInfoComponent = this.#tripInfoComponent;

    this.#tripInfoComponent = new TripInfoView({
      points: this.#tripsModel.trips,
      destinations: this.#destinationsModel.destinations,
      offers: this.#offersModel.offers
    });

    if (prevTripInfoComponent === null) {
      render(this.#tripInfoComponent, this.#container, 'afterbegin');
      return;
    }

    replace(this.#tripInfoComponent, prevTripInfoComponent);
    remove(prevTripInfoComponent);
  }

  #handleModelEvent = () => {
    this.init();
  };
}
