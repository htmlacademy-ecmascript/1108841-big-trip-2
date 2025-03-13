import AbstractView from '../framework/view/abstract-view.js';
import { formatDate, calculateDuration } from '../utils/date-format.js';
import { DateFormat, PointIconSize } from '../const.js';
import he from 'he';

export default class PointView extends AbstractView {
  #point = null;
  #destinations = null;
  #offers = null;
  #handleRollupButtonClick = null;
  #handleFavoriteClick = null;
  #isDisabled = false;

  constructor({ point, destinations, offers, onRollupClick, onFavoriteClick }) {
    super();
    this.#point = point;
    this.#destinations = destinations;
    this.#offers = offers;
    this.#handleRollupButtonClick = onRollupClick;
    this.#handleFavoriteClick = onFavoriteClick;

    this._restoreHandlers();
  }

  _restoreHandlers() {
    this.setEventListeners();
  }

  // Геттеры
  get point() {
    return this.#point;
  }

  get template() {
    const destination = this.#destinations.find((dest) => dest.id === this.#point.destination);
    const pointTypeOffers = this.#offers.find((offer) => offer.type === this.#point.type)?.offers || [];
    const selectedOffers = pointTypeOffers.filter((offer) => this.#point.offers.includes(offer.id));

    const offersMarkup = selectedOffers.map((offer) => `
      <li class="event__offer">
        <span class="event__offer-title">${he.encode(offer.title)}</span>
        &plus;&euro;&nbsp;
        <span class="event__offer-price">${he.encode(String(offer.price))}</span>
      </li>
    `).join('');

    return `
      <li class="trip-events__item">
        <div class="event" data-id="${he.encode(this.#point.id)}">
          <time class="event__date" datetime="${he.encode(this.#point.dateFrom)}">
            ${he.encode(formatDate(this.#point.dateFrom, DateFormat.MONTH))} ${he.encode(formatDate(this.#point.dateFrom, DateFormat.DAY))}
          </time>
          <div class="event__type">
            <img class="event__type-icon" width="${PointIconSize.LARGE}" height="${PointIconSize.LARGE}" src="img/icons/${he.encode(this.#point.type)}.png" alt="Event type icon">
          </div>
          <h3 class="event__title">${he.encode(this.#point.type)} ${he.encode(destination ? destination.name : '')}</h3>
          <div class="event__schedule">
            <p class="event__time">
              <time class="event__start-time" datetime="${he.encode(this.#point.dateFrom)}">${he.encode(formatDate(this.#point.dateFrom, DateFormat.HOURS_MINUTES))}</time>
              &mdash;
              <time class="event__end-time" datetime="${he.encode(this.#point.dateTo)}">${he.encode(formatDate(this.#point.dateTo, DateFormat.HOURS_MINUTES))}</time>
            </p>
            <p class="event__duration">${he.encode(calculateDuration(this.#point.dateFrom, this.#point.dateTo))}</p>
          </div>
          <p class="event__price">
            &euro;&nbsp;<span class="event__price-value">${he.encode(String(this.#point.basePrice))}</span>
          </p>
          <h4 class="visually-hidden">Offers:</h4>
          <ul class="event__selected-offers">
            ${offersMarkup}
          </ul>
          <button class="event__favorite-btn ${this.#point.isFavorite ? 'event__favorite-btn--active' : ''}" type="button" ${this.#isDisabled ? 'disabled' : ''}>
            <span class="visually-hidden">Add to favorite</span>
            <svg class="event__favorite-icon" width="${PointIconSize.MEDIUM}" height="${PointIconSize.MEDIUM}" viewBox="0 0 28 28">
              <path d="M14 21l-8.22899 4.3262 1.57159-9.1631L.685209 9.67376 9.8855 8.33688 14 0l4.1145 8.33688 9.2003 1.33688-6.6574 6.48934 1.5716 9.1631L14 21z"/>
            </svg>
          </button>
          <button class="event__rollup-btn" type="button" ${this.#isDisabled ? 'disabled' : ''}>
            <span class="visually-hidden">Open event</span>
          </button>
        </div>
      </li>
    `;
  }

  // Методы класса
  setEventListeners() {
    const element = this.element;
    const rollupBtn = element.querySelector('.event__rollup-btn');
    const favoriteBtn = element.querySelector('.event__favorite-btn');

    rollupBtn.addEventListener('click', this.#onRollupButtonClick);
    favoriteBtn.addEventListener('click', this.#onFavoriteButtonClick);
  }

  setDisabled(isDisabled) {
    this.#isDisabled = isDisabled;
    this.element.querySelector('.event__rollup-btn').disabled = isDisabled;
    this.element.querySelector('.event__favorite-btn').disabled = isDisabled;
  }

  updateElement(update) {
    if (!update) {
      return;
    }

    // Обновляем данные точки
    this.#point = {...this.#point, ...update};

    // Сохраняем ссылку на старый элемент
    const oldElement = this.element;

    // Удаляем ссылку на элемент, чтобы при следующем обращении к this.element
    // был создан новый элемент с обновленными данными
    this.removeElement();

    // Получаем новый элемент с обновленными данными
    const newElement = this.element;

    // Обновляем DOM
    const parent = oldElement.parentElement;
    if (parent) {
      // Заменяем старый элемент новым
      parent.replaceChild(newElement, oldElement);
    }

    // Восстанавливаем обработчики событий
    this._restoreHandlers();
  }

  // Обработчики событий
  #onRollupButtonClick = (evt) => {
    evt.preventDefault();
    this.#handleRollupButtonClick();
  };

  #onFavoriteButtonClick = (evt) => {
    evt.preventDefault();
    this.#handleFavoriteClick();
  };
}
