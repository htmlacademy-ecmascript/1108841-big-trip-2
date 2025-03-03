import AbstractView from '../framework/view/abstract-view.js';
import { POINT_TYPES } from '../const.js';
import { formatDate } from '../utils.js';
import { DateFormat } from '../const.js';

export default class PointEditView extends AbstractView {
  #point = null;
  #destinations = null;
  #offers = null;
  #onFormSubmit = null;
  #onRollupButtonClick = null;

  constructor({ point, destinations, offers, onSubmit, onRollupClick }) {
    super();
    this.#point = point;
    this.#destinations = destinations;
    this.#offers = offers;
    this.#onFormSubmit = onSubmit;
    this.#onRollupButtonClick = onRollupClick;
  }

  get point() {
    return this.#point;
  }

  setEventListeners() {
    this.element.querySelector('form')
      .addEventListener('submit', this.#onFormSubmitClick);

    this.element.querySelector('.event__rollup-btn')
      .addEventListener('click', this.#onRollupButtonClickAction);
  }

  #onFormSubmitClick = (evt) => {
    evt.preventDefault();
    this.#onFormSubmit();
  };

  #onRollupButtonClickAction = (evt) => {
    evt.preventDefault();
    this.#onRollupButtonClick();
  };

  get template() {
    const destination = this.#destinations.find((dest) => dest.id === this.#point.destination);
    const typeOffers = this.#offers.find((offer) => offer.type === this.#point.type)?.offers || [];

    const pointTypesTemplate = POINT_TYPES.map((type) => `
      <div class="event__type-item">
        <input
          id="event-type-${type}-1"
          class="event__type-input visually-hidden"
          type="radio"
          name="event-type"
          value="${type}"
          ${this.#point.type === type ? 'checked' : ''}
        >
        <label
          class="event__type-label event__type-label--${type}"
          for="event-type-${type}-1"
        >
          ${type}
        </label>
      </div>
    `).join('');

    const destinationsTemplate = this.#destinations.map((dest) => `
      <option value="${dest.name}"></option>
    `).join('');

    const offersTemplate = typeOffers.map((offer) => `
      <div class="event__offer-selector">
        <input
          class="event__offer-checkbox visually-hidden"
          id="event-offer-${offer.id}"
          type="checkbox"
          name="event-offer-${offer.id}"
          ${this.#point.offers.includes(offer.id) ? 'checked' : ''}
        >
        <label class="event__offer-label" for="event-offer-${offer.id}">
          <span class="event__offer-title">${offer.title}</span>
          &plus;&euro;&nbsp;
          <span class="event__offer-price">${offer.price}</span>
        </label>
      </div>
    `).join('');

    const destinationTemplate = destination ? `
      <section class="event__section  event__section--destination">
        <h3 class="event__section-title  event__section-title--destination">Destination</h3>
        <p class="event__destination-description">${destination.description}</p>
        ${destination.pictures.length ? `
          <div class="event__photos-container">
            <div class="event__photos-tape">
              ${destination.pictures.map((picture) => `
                <img class="event__photo" src="${picture.src}" alt="${picture.description}">
              `).join('')}
            </div>
          </div>
        ` : ''}
      </section>
    ` : '';

    return `
      <li class="trip-events__item">
        <form class="event event--edit" action="#" method="post">
          <header class="event__header">
            <div class="event__type-wrapper">
              <label class="event__type event__type-btn" for="event-type-toggle-1">
                <span class="visually-hidden">Choose event type</span>
                <img class="event__type-icon" width="17" height="17" src="img/icons/${this.#point.type}.png" alt="Event type icon">
              </label>
              <input class="event__type-toggle visually-hidden" id="event-type-toggle-1" type="checkbox">
              <div class="event__type-list">
                <fieldset class="event__type-group">
                  <legend class="visually-hidden">Event type</legend>
                  ${pointTypesTemplate}
                </fieldset>
              </div>
            </div>

            <div class="event__field-group event__field-group--destination">
              <label class="event__label event__type-output" for="event-destination-1">
                ${this.#point.type}
              </label>
              <input
                class="event__input event__input--destination"
                id="event-destination-1"
                type="text"
                name="event-destination"
                value="${destination ? destination.name : ''}"
                list="destination-list-1"
              >
              <datalist id="destination-list-1">
                ${destinationsTemplate}
              </datalist>
            </div>

            <div class="event__field-group event__field-group--time">
              <label class="visually-hidden" for="event-start-time-1">From</label>
              <input
                class="event__input event__input--time"
                id="event-start-time-1"
                type="text"
                name="event-start-time"
                value="${formatDate(this.#point.dateFrom, DateFormat.FULL)}"
              >
              &mdash;
              <label class="visually-hidden" for="event-end-time-1">To</label>
              <input
                class="event__input event__input--time"
                id="event-end-time-1"
                type="text"
                name="event-end-time"
                value="${formatDate(this.#point.dateTo, DateFormat.FULL)}"
              >
            </div>

            <div class="event__field-group event__field-group--price">
              <label class="event__label" for="event-price-1">
                <span class="visually-hidden">Price</span>
                &euro;
              </label>
              <input
                class="event__input event__input--price"
                id="event-price-1"
                type="text"
                name="event-price"
                value="${this.#point.basePrice}"
              >
            </div>

            <button class="event__save-btn btn btn--blue" type="submit">Save</button>
            <button class="event__reset-btn" type="reset">Delete</button>
            <button class="event__rollup-btn" type="button">
              <span class="visually-hidden">Open event</span>
            </button>
          </header>
          <section class="event__details">
            ${typeOffers.length ? `
              <section class="event__section event__section--offers">
                <h3 class="event__section-title event__section-title--offers">Offers</h3>
                <div class="event__available-offers">
                  ${offersTemplate}
                </div>
              </section>
            ` : ''}
            ${destinationTemplate}
          </section>
        </form>
      </li>
    `;
  }
}
