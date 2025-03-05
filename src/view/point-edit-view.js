import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import { POINT_TYPES } from '../const.js';
import { formatDate } from '../utils.js';
import { DateFormat } from '../const.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

export default class PointEditView extends AbstractStatefulView {
  #destinations = null;
  #offers = null;
  #onFormSubmit = null;
  #onRollupButtonClick = null;
  #onDeleteClick = null;
  #datepickerFrom = null;
  #datepickerTo = null;

  constructor({ point, destinations, offers, onSubmit, onRollupClick, onDeleteClick }) {
    super();
    this.#destinations = destinations;
    this.#offers = offers;
    this.#onFormSubmit = onSubmit;
    this.#onRollupButtonClick = onRollupClick;
    this.#onDeleteClick = onDeleteClick;

    this._state = this.#parsePointToState(point);
    // Не вызываем _restoreHandlers здесь, так как элемент еще не создан
    // Вместо этого, _restoreHandlers будет вызван из setEventListeners
  }

  #parsePointToState(point) {
    return {...point};
  }

  #parseStateToPoint() {
    return {...this._state};
  }

  setEventListeners() {
    // Перенаправляем на метод _restoreHandlers для настройки всех обработчиков
    this._restoreHandlers();
  }

  _restoreHandlers() {
    this.element
      .querySelector('.event__type-list')
      .addEventListener('change', this.#eventTypeChangeHandler);

    this.element
      .querySelector('.event__input--destination')
      .addEventListener('change', this.#destinationChangeHandler);

    this.element
      .querySelector('.event__input--price')
      .addEventListener('change', this.#basePriceChangeHandler);

    const availableOffers = this.element.querySelector('.event__available-offers');
    if (availableOffers) {
      availableOffers.addEventListener('change', this.#offersChangeHandler);
    }

    // Внешние обработчики
    this.element.querySelector('.event__rollup-btn')
      .addEventListener('click', this.#onRollupButtonClickAction);

    this.element.querySelector('.event__reset-btn')
      .addEventListener('click', this.#onDeleteClickHandler);

    this.element.querySelector('form')
      .addEventListener('submit', this.#onFormSubmitHandler);

    // Восстанавливаем датапикеры
    this.#setDatepickers();
  }

  #setDatepickers() {
    const dateConfig = {
      enableTime: true,
      time24hr: true,
      dateFormat: DateFormat.DATE_PICKER,
    };

    this.#datepickerFrom = flatpickr(
      this.element.querySelector('#event-start-time-1'),
      {
        ...dateConfig,
        defaultDate: this._state.dateFrom,
        onClose: this.#dateFromChangeHandler,
        maxDate: this._state.dateTo,
      }
    );

    this.#datepickerTo = flatpickr(
      this.element.querySelector('#event-end-time-1'),
      {
        ...dateConfig,
        defaultDate: this._state.dateTo,
        onClose: this.#dateToChangeHandler,
        minDate: this._state.dateFrom,
      }
    );
  }

  #dateFromChangeHandler = ([userDate]) => {
    this.updateElement({
      dateFrom: userDate,
    });
  };

  #dateToChangeHandler = ([userDate]) => {
    this.updateElement({
      dateTo: userDate,
    });
  };

  #eventTypeChangeHandler = (evt) => {
    evt.preventDefault();
    if (!evt.target.classList.contains('event__type-input')) {
      return;
    }

    this.updateElement({
      type: evt.target.value,
      offers: []
    });
  };

  #destinationChangeHandler = (evt) => {
    evt.preventDefault();
    const selectedDestination = this.#destinations.find((destination) => destination.name === evt.target.value);

    if (!selectedDestination) {
      evt.target.value = '';
      return;
    }

    this.updateElement({
      destination: selectedDestination.id
    });
  };

  #offersChangeHandler = (evt) => {
    evt.preventDefault();
    const offerId = evt.target.name.split('-')[2];
    const currentOffers = [...this._state.offers];

    if (evt.target.checked) {
      currentOffers.push(offerId);
    } else {
      const index = currentOffers.indexOf(offerId);
      if (index !== -1) {
        currentOffers.splice(index, 1);
      }
    }

    this.updateElement({
      offers: currentOffers
    });
  };

  #basePriceChangeHandler = (evt) => {
    evt.preventDefault();
    this.updateElement({
      basePrice: parseInt(evt.target.value, 10)
    });
  };

  #onRollupButtonClickAction = (evt) => {
    evt.preventDefault();
    this.#onRollupButtonClick();
  };

  #onDeleteClickHandler = (evt) => {
    evt.preventDefault();
    this.#onDeleteClick(this.#parseStateToPoint());
  };

  #onFormSubmitHandler = (evt) => {
    evt.preventDefault();
    this.#onFormSubmit(this.#parseStateToPoint());
  };

  #createDestinationTemplate() {
    const { destination } = this._state;
    const destinationsList = this.#destinations.map((item) => item.name);

    return `<div class="event__field-group  event__field-group--destination">
      <label class="event__label  event__type-output" for="event-destination-1">
        ${destination?.type ?? ''}
      </label>
      <input class="event__input  event__input--destination" id="event-destination-1" type="text" name="event-destination" value="${destination?.name ?? ''}" list="destination-list-1">
      <datalist id="destination-list-1">
        ${destinationsList.map((city) => `<option value="${city}"></option>`).join('')}
      </datalist>
    </div>`;
  }

  #createBaseDetailsTemplate() {
    const { basePrice } = this._state;

    return `<div class="event__details">
          <div class="event__field-group  event__field-group--price">
            <label class="event__label" for="event-price-1">
              <span class="visually-hidden">Price</span>
              &euro;
            </label>
            <input class="event__input  event__input--price" id="event-price-1" type="number" min="1" name="event-price" value="${basePrice ?? ''}">
          </div>
          ${this.#createOffersTemplate()}
          ${this.#createDestinationDescriptionTemplate()}
        </div>`;
  }

  #createOffersTemplate() {
    const { type, offers: selectedOffers } = this._state;
    const typeOffers = this.#offers.find((offer) => offer.type === type)?.offers || [];

    if (typeOffers.length === 0) {
      return '';
    }

    const offersTemplate = typeOffers.map((offer) => {
      const isChecked = selectedOffers?.includes(offer.id) ? 'checked' : '';

      return `<div class="event__offer-selector">
        <input class="event__offer-checkbox visually-hidden" id="event-offer-${offer.id}-1" type="checkbox" name="event-offer-${offer.id}" ${isChecked}>
        <label class="event__offer-label" for="event-offer-${offer.id}-1">
          <span class="event__offer-title">${offer.title}</span>
          &plus;&euro;&nbsp;
          <span class="event__offer-price">${offer.price}</span>
        </label>
      </div>`;
    }).join('');

    return `<section class="event__section event__section--offers">
      <h3 class="event__section-title event__section-title--offers">Offers</h3>
      <div class="event__available-offers">
        ${offersTemplate}
      </div>
    </section>`;
  }

  #createDestinationDescriptionTemplate() {
    const { destination: destinationId } = this._state;
    const destination = this.#destinations.find((dest) => dest.id === destinationId);

    if (!destination) {
      return '';
    }

    const { description, pictures } = destination;

    if (!description && (!pictures || pictures.length === 0)) {
      return '';
    }

    const picturesTemplate = pictures?.map((picture) =>
      `<img class="event__photo" src="${picture.src}" alt="${picture.description}">`
    ).join('') || '';

    const photosContainerTemplate = pictures?.length
      ? `<div class="event__photos-container">
          <div class="event__photos-tape">
            ${picturesTemplate}
          </div>
        </div>`
      : '';

    return `<section class="event__section event__section--destination">
      <h3 class="event__section-title event__section-title--destination">Destination</h3>
      <p class="event__destination-description">${description}</p>
      ${photosContainerTemplate}
    </section>`;
  }

  get template() {
    const pointTypesTemplate = POINT_TYPES.map((type) => `
      <div class="event__type-item">
        <input
          id="event-type-${type}-1"
          class="event__type-input visually-hidden"
          type="radio"
          name="event-type"
          value="${type}"
          ${this._state.type === type ? 'checked' : ''}
        >
        <label
          class="event__type-label event__type-label--${type}"
          for="event-type-${type}-1"
        >
          ${type}
        </label>
      </div>
    `).join('');

    return `<li class="trip-events__item">
        <form class="event event--edit" action="#" method="post">
          <header class="event__header">
            <div class="event__type-wrapper">
              <label class="event__type event__type-btn" for="event-type-toggle-1">
                <span class="visually-hidden">Choose event type</span>
                <img class="event__type-icon" width="17" height="17" src="img/icons/${this._state.type}.png" alt="Event type icon">
              </label>
              <input class="event__type-toggle visually-hidden" id="event-type-toggle-1" type="checkbox">

              <div class="event__type-list">
                <fieldset class="event__type-group">
                  <legend class="visually-hidden">Event type</legend>
                  ${pointTypesTemplate}
                </fieldset>
              </div>
            </div>

            ${this.#createDestinationTemplate()}

            <div class="event__field-group event__field-group--time">
              <label class="visually-hidden" for="event-start-time-1">From</label>
              <input
                class="event__input event__input--time"
                id="event-start-time-1"
                type="text"
                name="event-start-time"
                value="${formatDate(this._state.dateFrom, DateFormat.DATE_PICKER)}"
              >
              &mdash;
              <label class="visually-hidden" for="event-end-time-1">To</label>
              <input
                class="event__input event__input--time"
                id="event-end-time-1"
                type="text"
                name="event-end-time"
                value="${formatDate(this._state.dateTo, DateFormat.DATE_PICKER)}"
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
                type="number"
                min="1"
                name="event-price"
                value="${this._state.basePrice ?? ''}"
              >
            </div>

            <button class="event__save-btn btn btn--blue" type="submit">Save</button>
            <button class="event__reset-btn" type="reset">Delete</button>
            <button class="event__rollup-btn" type="button">
              <span class="visually-hidden">Open event</span>
            </button>
          </header>
          ${this.#createBaseDetailsTemplate()}
        </form>
      </li>`;
  }

  removeElement() {
    super.removeElement();

    if (this.#datepickerFrom) {
      this.#datepickerFrom.destroy();
      this.#datepickerFrom = null;
    }

    if (this.#datepickerTo) {
      this.#datepickerTo.destroy();
      this.#datepickerTo = null;
    }
  }
}
