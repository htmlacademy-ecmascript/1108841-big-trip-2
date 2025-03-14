import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import { PointTypes, DateFormat, PointIconSize, PriceConfig, ButtonText } from '../const.js';
import { formatDate } from '../utils/date-format.js';
import he from 'he';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
export default class PointEditView extends AbstractStatefulView {
  #destinations = null;
  #offers = null;
  #handleFormSubmit = null;
  #handleRollupButtonClick = null;
  #handleDeleteClick = null;
  #datepickerFrom = null;
  #datepickerTo = null;
  #escKeyDownHandler = null;
  constructor({ point, destinations, offers, onSubmit, onRollupClick, onDeleteClick }) {
    super();
    this.#destinations = destinations;
    this.#offers = offers;
    this.#handleFormSubmit = onSubmit;
    this.#handleRollupButtonClick = onRollupClick;
    this.#handleDeleteClick = onDeleteClick;
    this._state = this.#parsePointToState(point);
    this._restoreHandlers();
  }
  get template() {
    const pointTypes = PointTypes.ITEMS.map((pointType) => `
      <div class="event__type-item">
        <input id="event-type-${he.encode(pointType)}-1" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${he.encode(pointType)}" ${this._state.type === pointType ? 'checked' : ''}>
        <label
          class="event__type-label event__type-label--${he.encode(pointType)}"
          for="event-type-${he.encode(pointType)}-1"
        >
          ${he.encode(pointType)}
        </label>
      </div>
    `).join('');
    return `<li class="trip-events__item">
        <form class="event event--edit" action="#" method="post">
          <header class="event__header">
            <div class="event__type-wrapper">
              <label class="event__type event__type-btn" for="event-type-toggle-1">
                <span class="visually-hidden">Choose event type</span>
                <img class="event__type-icon" width="${PointIconSize.SMALL}" height="${PointIconSize.SMALL}" src="img/icons/${he.encode(this._state.type)}.png" alt="Event type icon">
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
                value="${!this._state.id ? '' : he.encode(formatDate(this._state.dateFrom, DateFormat.DATE_PICKER))}"
              >
              &mdash;
              <label class="visually-hidden" for="event-end-time-1">To</label>
              <input
                class="event__input event__input--time"
                id="event-end-time-1"
                type="text"
                name="event-end-time"
                value="${!this._state.id ? '' : he.encode(formatDate(this._state.dateTo, DateFormat.DATE_PICKER))}"
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
                value="${he.encode(String(this._state.basePrice ?? PriceConfig.DEFAULT))}"
              >
            </div>
            <button class="event__save-btn" type="submit" ${this._state.isDisabled ? 'aria-disabled="true"' : ''}>
              ${this._state.isSaving ? ButtonText.SAVING : ButtonText.SAVE}
            </button>
            <button class="event__reset-btn" type="reset" ${this._state.isDisabled ? 'aria-disabled="true"' : ''}>
              ${this.#getResetButtonText()}
            </button>
            <button class="event__rollup-btn" type="button" ${this._state.isDisabled ? 'aria-disabled="true"' : ''}>
              <span class="visually-hidden">Open event</span>
            </button>
          </header>
          ${this.#generateBaseDetailsTemplate()}
        </form>
      </li>`;
  }
  _restoreHandlers() {
    const element = this.element;
    const typeList = element.querySelector('.event__type-list');
    const destinationInput = element.querySelector('.event__input--destination');
    const priceInput = element.querySelector('.event__input--price');
    const availableOffers = element.querySelector('.event__available-offers');
    const rollupBtn = element.querySelector('.event__rollup-btn');
    const resetBtn = element.querySelector('.event__reset-btn');
    const form = element.querySelector('form');
    typeList.addEventListener('change', this.#onEventTypeChange);
    destinationInput.addEventListener('change', this.#onDestinationChange);
    priceInput.addEventListener('input', this.#onBasePriceChange);
    if (availableOffers) {
      const offerCheckboxes = element.querySelectorAll('.event__offer-checkbox');
      offerCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', this.#onOffersChange);
      });
    }
    rollupBtn.addEventListener('click', this.#onRollupButtonClick);
    resetBtn.addEventListener('click', this.#onDeleteClick);
    form.addEventListener('submit', this.#onFormSubmit);
    this.#setDatepickers();
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
  setEventListeners() {
    this._restoreHandlers();
  }
  reset(point) {
    this.updateElement(this.#parsePointToState(point));
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
  #setDatepickers() {
    const element = this.element;
    const dateFromElement = element.querySelector('#event-start-time-1');
    const dateToElement = element.querySelector('#event-end-time-1');
    const dateConfig = {
      dateFormat: 'd/m/y H:i',
      enableTime: true,
      locale: {
        firstDayOfWeek: 1,
      },
      'time_24hr': true,
      static: true,
      appendTo: element.querySelector('.event__field-group--time'),
      onOpen: () => {
        const calendars = document.querySelectorAll('.flatpickr-calendar');
        calendars.forEach((calendar) => {
          calendar.style.opacity = '1';
          calendar.style.visibility = 'visible';
          calendar.style.display = 'block';
          calendar.style.zIndex = '9999';
        });
      }
    };
    this.#datepickerFrom = flatpickr(
      dateFromElement,
      {
        ...dateConfig,
        defaultDate: this._state.id ? this._state.dateFrom : null,
        onClose: this.#onDateFromChange,
        maxDate: this._state.dateTo,
      }
    );
    this.#datepickerTo = flatpickr(
      dateToElement,
      {
        ...dateConfig,
        defaultDate: this._state.id ? this._state.dateTo : null,
        onClose: this.#onDateToChange,
        minDate: this._state.dateFrom,
      }
    );
  }
  #generateDestinationTemplate() {
    const { destination } = this._state;
    const destinations = this.#destinations.map((item) => item.name);
    return `<div class="event__field-group  event__field-group--destination">
      <label class="event__label  event__type-output" for="event-destination-1">
        ${he.encode(this._state.type)}
      </label>
      <input class="event__input  event__input--destination" id="event-destination-1" type="text" name="event-destination" value="${he.encode(this.#getDestinationName(destination))}" list="destination-list-1">
      <datalist id="destination-list-1">
        ${destinations.map((item) => `<option value="${he.encode(item)}"></option>`).join('')}
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
    const offersMarkup = this.#generateOffersTemplate(type);
    if (!destinationData || (destinationData.name === 'Empty destination' && !destinationData.description && (!destinationData.pictures || destinationData.pictures.length === 0))) {
      return `<section class="event__details">
        ${offersMarkup}
      </section>`;
    }
    const { description, pictures } = destinationData;
    const picturesMarkup = pictures && pictures.length > 0
      ? `<div class="event__photos-container">
          <div class="event__photos-tape">
            ${pictures.map((pic) => `<img class="event__photo" src="${he.encode(pic.src)}" alt="${he.encode(pic.description)}">`).join('')}
          </div>
        </div>`
      : '';
    const descriptionMarkup = description
      ? `<p class="event__destination-description">${he.encode(description)}</p>`
      : '';
    const destinationSectionMarkup = (description || (pictures && pictures.length > 0))
      ? `<section class="event__section event__section--destination">
          <h3 class="event__section-title event__section-title--destination">Destination</h3>
          ${descriptionMarkup}
          ${picturesMarkup}
        </section>`
      : '';
    return `<section class="event__details">
      ${offersMarkup}
      ${destinationSectionMarkup}
    </section>`;
  }
  #generateOffersTemplate(eventType) {
    const allOffersByType = this.#offers.find((offer) => offer.type === eventType);
    if (!allOffersByType?.offers?.length) {
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
    const disabled = this._state.isDisabled ? 'aria-disabled="true"' : '';
    return `<div class="event__offer-selector">
      <input class="event__offer-checkbox visually-hidden" id="event-offer-${he.encode(String(id))}-1" type="checkbox" name="event-offer-${he.encode(String(id))}" ${checked} ${disabled} data-offer-id="${he.encode(String(id))}">
      <label class="event__offer-label" for="event-offer-${he.encode(String(id))}-1">
        <span class="event__offer-title">${he.encode(title)}</span>
        &plus;&euro;&nbsp;
        <span class="event__offer-price">${he.encode(String(price))}</span>
      </label>
    </div>`;
  }
  #onDateFromChange = ([userDate]) => {
    if (!userDate) {
      return;
    }
    this.updateElement({
      dateFrom: userDate.toISOString(),
    });
  };
  #onDateToChange = ([userDate]) => {
    if (!userDate) {
      return;
    }
    this.updateElement({
      dateTo: userDate.toISOString(),
    });
  };
  #onEventTypeChange = (evt) => {
    evt.preventDefault();
    if (!evt.target.classList.contains('event__type-input')) {
      return;
    }
    const newType = evt.target.value;
    const currentType = this._state.type;
    if (newType !== currentType) {
      this.updateElement({
        type: newType,
        offers: []
      });
    }
  };
  #onDestinationChange = (evt) => {
    evt.preventDefault();
    const destinationName = evt.target.value;
    const selectedDestination = this.#destinations.find((destination) => destination.name === destinationName);
    if (destinationName === 'Empty destination') {
      this.updateElement({
        destination: this.#destinations.find((dest) => dest.name === 'Empty destination')?.id || null
      });
      return;
    }
    if (!selectedDestination) {
      evt.target.value = '';
      return;
    }
    this.updateElement({
      destination: selectedDestination.id
    });
  };
  #onOffersChange = (evt) => {
    evt.preventDefault();
    if (!evt.target.classList.contains('event__offer-checkbox')) {
      return;
    }
    const offerId = evt.target.dataset.offerId || evt.target.name.split('-')[2];
    const currentOffers = [...this._state.offers];
    if (evt.target.checked) {
      if (!currentOffers.includes(offerId)) {
        currentOffers.push(offerId);
      }
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
  #onBasePriceChange = (evt) => {
    evt.preventDefault();
    const price = parseInt(evt.target.value, 10);
    if (!isNaN(price) && price >= PriceConfig.MIN) {
      this.updateElement({
        basePrice: price
      });
    }
  };
  #onRollupButtonClick = (evt) => {
    evt.preventDefault();
    this.#handleRollupButtonClick();
  };
  #onDeleteClick = (evt) => {
    evt.preventDefault();
    this.#handleDeleteClick(this.#parseStateToPoint());
  };
  #onFormSubmit = (evt) => {
    evt.preventDefault();
    this.#handleFormSubmit(this.#parseStateToPoint());
  };
  setSaving() {
    this.updateElement({
      isSaving: true,
      isDisabled: true
    });
  }
  setDeleting() {
    this.updateElement({
      isDeleting: true,
      isDisabled: true
    });
  }
  setAborting() {
    const resetFormState = () => {
      this.updateElement({
        isSaving: false,
        isDeleting: false,
        isDisabled: false
      });
    };
    this.shake(resetFormState);
  }
  #getResetButtonText() {
    if (!this._state.id) {
      return 'Cancel';
    }
    return this._state.isDeleting ? ButtonText.DELETING : ButtonText.DELETE;
  }
  updateElement(update) {
    super.updateElement(update);
    if (this._state.isDisabled) {
      const form = this.element.querySelector('form');
      if (form) {
        form.classList.add('disabled');
        const buttons = form.querySelectorAll('button');
        const inputs = form.querySelectorAll('input');
        const selects = form.querySelectorAll('select');
        const labels = form.querySelectorAll('label');
        buttons.forEach((button) => {
          button.setAttribute('aria-disabled', 'true');
          button.style.opacity = '0.5';
        });
        inputs.forEach((input) => {
          input.setAttribute('aria-disabled', 'true');
          input.style.opacity = '0.5';
        });
        selects.forEach((select) => {
          select.setAttribute('aria-disabled', 'true');
          select.style.opacity = '0.5';
        });
        labels.forEach((label) => {
          label.style.opacity = '0.5';
        });
      }
    } else {
      const form = this.element.querySelector('form');
      if (form) {
        form.classList.remove('disabled');
        const buttons = form.querySelectorAll('button');
        const inputs = form.querySelectorAll('input');
        const selects = form.querySelectorAll('select');
        const labels = form.querySelectorAll('label');
        buttons.forEach((button) => {
          button.removeAttribute('aria-disabled');
          button.style.opacity = '1';
        });
        inputs.forEach((input) => {
          input.removeAttribute('aria-disabled');
          input.style.opacity = '1';
        });
        selects.forEach((select) => {
          select.removeAttribute('aria-disabled');
          select.style.opacity = '1';
        });
        labels.forEach((label) => {
          label.style.opacity = '1';
        });
      }
    }
  }
}
