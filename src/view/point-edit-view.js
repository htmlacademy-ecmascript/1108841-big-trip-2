import { createElement } from '../render.js';

const POINT_TYPES = ['taxi', 'bus', 'train', 'ship', 'drive', 'flight', 'check-in', 'sightseeing', 'restaurant'];

function createPointTypeTemplate(type, currentType) {
  return POINT_TYPES.map((pointType) => `
    <div class="event__type-item">
      <input
        id="event-type-${pointType}-1"
        class="event__type-input visually-hidden"
        type="radio"
        name="event-type"
        value="${pointType}"
        ${currentType === pointType ? 'checked' : ''}
      >
      <label
        class="event__type-label event__type-label--${pointType}"
        for="event-type-${pointType}-1"
      >
        ${pointType.charAt(0).toUpperCase() + pointType.slice(1)}
      </label>
    </div>
  `).join('');
}

function createDestinationListTemplate(destinations) {
  return destinations.map((destination) => `
    <option value="${destination.name}"></option>
  `).join('');
}

function createOffersTemplate(offers, selectedOffers = []) {
  if (!offers.length) {
    return '';
  }

  return `
    <section class="event__section  event__section--offers">
      <h3 class="event__section-title  event__section-title--offers">Offers</h3>
      <div class="event__available-offers">
        ${offers.map((offer) => `
          <div class="event__offer-selector">
            <input
              class="event__offer-checkbox visually-hidden"
              id="event-offer-${offer.id}"
              type="checkbox"
              name="event-offer-${offer.id}"
              ${selectedOffers.includes(offer.id) ? 'checked' : ''}
            >
            <label class="event__offer-label" for="event-offer-${offer.id}">
              <span class="event__offer-title">${offer.title}</span>
              &plus;&euro;&nbsp;
              <span class="event__offer-price">${offer.price}</span>
            </label>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function createDestinationTemplate(destination) {
  if (!destination) {
    return '';
  }

  return `
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
  `;
}

function createPointEditTemplate(point = {}, destinations = [], offers = []) {
  const {
    type = 'flight',
    destination: destinationId,
    basePrice = '',
    dateFrom = new Date(),
    dateTo = new Date(),
    offers: selectedOffers = []
  } = point;

  const destination = destinations.find((dest) => dest.id === destinationId);
  const availableOffers = offers.find((offer) => offer.type === type)?.offers || [];

  return `
    <form class="event event--edit" action="#" method="post">
      <header class="event__header">
        <div class="event__type-wrapper">
          <label class="event__type event__type-btn" for="event-type-toggle-1">
            <span class="visually-hidden">Choose event type</span>
            <img class="event__type-icon" width="17" height="17" src="img/icons/${type}.png" alt="Event type icon">
          </label>
          <input class="event__type-toggle visually-hidden" id="event-type-toggle-1" type="checkbox">

          <div class="event__type-list">
            <fieldset class="event__type-group">
              <legend class="visually-hidden">Event type</legend>
              ${createPointTypeTemplate(type)}
            </fieldset>
          </div>
        </div>

        <div class="event__field-group event__field-group--destination">
          <label class="event__label event__type-output" for="event-destination-1">
            ${type}
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
            ${createDestinationListTemplate(destinations)}
          </datalist>
        </div>

        <div class="event__field-group event__field-group--time">
          <label class="visually-hidden" for="event-start-time-1">From</label>
          <input
            class="event__input event__input--time"
            id="event-start-time-1"
            type="text"
            name="event-start-time"
            value="${dateFrom}"
          >
          &mdash;
          <label class="visually-hidden" for="event-end-time-1">To</label>
          <input
            class="event__input event__input--time"
            id="event-end-time-1"
            type="text"
            name="event-end-time"
            value="${dateTo}"
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
            value="${basePrice}"
          >
        </div>

        <button class="event__save-btn btn btn--blue" type="submit">Save</button>
        <button class="event__reset-btn" type="reset">Delete</button>
        <button class="event__rollup-btn" type="button">
          <span class="visually-hidden">Open event</span>
        </button>
      </header>
      <section class="event__details">
        ${createOffersTemplate(availableOffers, selectedOffers)}
        ${createDestinationTemplate(destination)}
      </section>
    </form>
  `;
}

export { createPointEditTemplate };
export default class PointEditView {
  #element = null;
  #point = null;
  #destinations = null;
  #offers = null;

  constructor(point, destinations, offers) {
    this.#point = point;
    this.#destinations = destinations;
    this.#offers = offers;
  }

  get template() {
    return createPointEditTemplate(this.#point, this.#destinations, this.#offers);
  }

  get element() {
    if (!this.#element) {
      this.#element = createElement(this.template);
    }

    return this.#element;
  }

  removeElement() {
    this.#element = null;
  }
}
