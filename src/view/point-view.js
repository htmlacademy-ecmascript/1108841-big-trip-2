import AbstractView from '../framework/view/abstract-view.js';
import { formatDate, getDuration } from '../utils/date-format.js';
import { DateFormat, PointIconSize } from '../const.js';

export default class PointView extends AbstractView {
  #point = null;
  #destinations = null;
  #offers = null;
  #onRollupButtonClick = null;
  #onFavoriteClick = null;

  constructor({ point, destinations, offers, onClick, onFavoriteClick }) {
    super();
    this.#point = point;
    this.#destinations = destinations;
    this.#offers = offers;
    this.#onRollupButtonClick = onClick;
    this.#onFavoriteClick = onFavoriteClick;
  }

  setEventListeners() {
    this.element
      .querySelector('.event__rollup-btn')
      .addEventListener('click', this.#onRollupButtonClickAction);

    this.element
      .querySelector('.event__favorite-btn')
      .addEventListener('click', this.#onFavoriteButtonClickAction);
  }

  get point() {
    return this.#point;
  }

  #onRollupButtonClickAction = (evt) => {
    evt.preventDefault();
    this.#onRollupButtonClick();
  };

  #onFavoriteButtonClickAction = (evt) => {
    evt.preventDefault();
    this.#onFavoriteClick();
  };

  get template() {
    const destination = this.#destinations.find((dest) => dest.id === this.#point.destination);
    const pointTypeOffers = this.#offers.find((offer) => offer.type === this.#point.type)?.offers || [];
    const selectedOffers = pointTypeOffers.filter((offer) => this.#point.offers.includes(offer.id));

    const offersMarkup = selectedOffers.map((offer) => `
      <li class="event__offer">
        <span class="event__offer-title">${offer.title}</span>
        &plus;&euro;&nbsp;
        <span class="event__offer-price">${offer.price}</span>
      </li>
    `).join('');

    return `
      <li class="trip-events__item">
        <div class="event">
          <time class="event__date" datetime="${this.#point.dateFrom}">
            ${formatDate(this.#point.dateFrom, DateFormat.MONTH)} ${formatDate(this.#point.dateFrom, DateFormat.DAY)}
          </time>
          <div class="event__type">
            <img class="event__type-icon" width="${PointIconSize.LARGE}" height="${PointIconSize.LARGE}" src="img/icons/${this.#point.type}.png" alt="Event type icon">
          </div>
          <h3 class="event__title">${this.#point.type} ${destination ? destination.name : ''}</h3>
          <div class="event__schedule">
            <p class="event__time">
              <time class="event__start-time" datetime="${this.#point.dateFrom}">${formatDate(this.#point.dateFrom, DateFormat.HOURS_MINUTES)}</time>
              &mdash;
              <time class="event__end-time" datetime="${this.#point.dateTo}">${formatDate(this.#point.dateTo, DateFormat.HOURS_MINUTES)}</time>
            </p>
            <p class="event__duration">${getDuration(this.#point.dateFrom, this.#point.dateTo)}</p>
          </div>
          <p class="event__price">
            &euro;&nbsp;<span class="event__price-value">${this.#point.basePrice}</span>
          </p>
          <h4 class="visually-hidden">Offers:</h4>
          <ul class="event__selected-offers">
            ${offersMarkup}
          </ul>
          <button class="event__favorite-btn ${this.#point.isFavorite ? 'event__favorite-btn--active' : ''}" type="button">
            <span class="visually-hidden">Add to favorite</span>
            <svg class="event__favorite-icon" width="${PointIconSize.MEDIUM}" height="${PointIconSize.MEDIUM}" viewBox="0 0 28 28">
              <path d="M14 21l-8.22899 4.3262 1.57159-9.1631L.685209 9.67376 9.8855 8.33688 14 0l4.1145 8.33688 9.2003 1.33688-6.6574 6.48934 1.5716 9.1631L14 21z"/>
            </svg>
          </button>
          <button class="event__rollup-btn" type="button">
            <span class="visually-hidden">Open event</span>
          </button>
        </div>
      </li>
    `;
  }
}
