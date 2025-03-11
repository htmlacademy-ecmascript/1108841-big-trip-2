import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import { PointTypes, DateFormat, PointIconSize, PriceConfig } from '../const.js';
import { formatDate } from '../utils/date-format.js';
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
  }

  #parsePointToState(point) {
    return {
      ...point,
      isSaving: false,
      isDeleting: false,
      isDisabled: false,
      isError: false
    };
  }

  #parseStateToPoint() {
    const point = {...this._state};

    delete point.isDisabled;
    delete point.isSaving;
    delete point.isDeleting;

    return point;
  }

  setEventListeners() {
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

    this.element.querySelector('.event__rollup-btn')
      .addEventListener('click', this.#onRollupButtonClickAction);

    this.element.querySelector('.event__reset-btn')
      .addEventListener('click', this.#onDeleteClickHandler);

    this.element.querySelector('form')
      .addEventListener('submit', this.#onFormSubmitHandler);

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

  #generateDestinationTemplate() {
    const { destination } = this._state;
    const destinations = this.#destinations.map((item) => item.name);

    return `<div class="event__field-group  event__field-group--destination">
      <label class="event__label  event__type-output" for="event-destination-1">
        ${this._state.type}
      </label>
      <input class="event__input  event__input--destination" id="event-destination-1" type="text" name="event-destination" value="${this.#getDestinationName(destination)}" list="destination-list-1">
      <datalist id="destination-list-1">
        ${destinations.map((item) => `<option value="${item}"></option>`).join('')}
      </datalist>
    </div>`;
  }

  #getDestinationName(destinationId) {
    const destination = this.#destinations.find((item) => item.id === destinationId);
    return destination ? destination.name : '';
  }

  #generateBaseDetailsTemplate() {
    const { destination, type } = this._state;
    const destinationData = this.#destinations.find((item) => item.id === destination);

    if (!destinationData) {
      return '';
    }

    const { description, pictures } = destinationData;

    const picturesMarkup = pictures && pictures.length > 0
      ? `<div class="event__photos-container">
          <div class="event__photos-tape">
            ${pictures.map((pic) => `<img class="event__photo" src="${pic.src}" alt="${pic.description}">`).join('')}
          </div>
        </div>`
      : '';

    const descriptionMarkup = description
      ? `<p class="event__destination-description">${description}</p>`
      : '';

    const offersMarkup = this.#generateOffersTemplate(type);

    return `<section class="event__details">
      ${offersMarkup}
      <section class="event__section  event__section--destination">
        <h3 class="event__section-title  event__section-title--destination">Destination</h3>
        ${descriptionMarkup}
        ${picturesMarkup}
      </section>
    </section>`;
  }

  #generateOffersTemplate(eventType) {
    const allOffersByType = this.#offers.find((offer) => offer.type === eventType);

    if (!allOffersByType || !allOffersByType.offers || allOffersByType.offers.length === 0) {
      return '';
    }

    const { offers } = allOffersByType;

    return `<section class="event__section  event__section--offers">
      <h3 class="event__section-title  event__section-title--offers">Offers</h3>
      <div class="event__available-offers">
        ${offers.map((offer) => this.#generateOfferTemplate(offer)).join('')}
      </div>
    </section>`;
  }

  #generateOfferTemplate(offer) {
    const { id, title, price } = offer;
    const checked = this._state.offers.includes(id) ? 'checked' : '';
    const disabled = this._state.isDisabled ? 'disabled' : '';

    return `<div class="event__offer-selector">
      <input class="event__offer-checkbox  visually-hidden" id="event-offer-${id}-1" type="checkbox" name="event-offer-${id}" ${checked} ${disabled}>
      <label class="event__offer-label" for="event-offer-${id}-1">
        <span class="event__offer-title">${title}</span>
        &plus;&euro;&nbsp;
        <span class="event__offer-price">${price}</span>
      </label>
    </div>`;
  }

  get template() {
    const pointTypes = PointTypes.ITEMS.map((pointType) => `
      <div class="event__type-item">
        <input id="event-type-${pointType}-1" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${pointType}" ${this._state.type === pointType ? 'checked' : ''}>
        <label
          class="event__type-label event__type-label--${pointType}"
          for="event-type-${pointType}-1"
        >
          ${pointType}
        </label>
      </div>
    `).join('');

    return `<li class="trip-events__item">
        <form class="event event--edit" action="#" method="post">
          <header class="event__header">
            <div class="event__type-wrapper">
              <label class="event__type event__type-btn" for="event-type-toggle-1">
                <span class="visually-hidden">Choose event type</span>
                <img class="event__type-icon" width="${PointIconSize.SMALL}" height="${PointIconSize.SMALL}" src="img/icons/${this._state.type}.png" alt="Event type icon">
              </label>
              <input class="event__type-toggle visually-hidden" id="event-type-toggle-1" type="checkbox">

              <div class="event__type-list">
                <fieldset class="event__type-group">
                  <legend class="visually-hidden">Event type</legend>
                  ${pointTypes}
                </fieldset>
              </div>
            </div>

            ${this.#generateDestinationTemplate()}

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
                min="${PriceConfig.MIN}"
                name="event-price"
                value="${this._state.basePrice ?? PriceConfig.DEFAULT}"
              >
            </div>

            <button class="event__save-btn btn btn--blue" type="submit" ${this._state.isDisabled ? 'disabled' : ''}>
              ${this._state.isSaving ? 'Saving...' : 'Save'}
            </button>
            <button class="event__reset-btn" type="reset" ${this._state.isDisabled ? 'disabled' : ''}>
              ${this._state.isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button class="event__rollup-btn" type="button" ${this._state.isDisabled ? 'disabled' : ''}>
              <span class="visually-hidden">Open event</span>
            </button>
          </header>
          ${this.#generateBaseDetailsTemplate()}
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
