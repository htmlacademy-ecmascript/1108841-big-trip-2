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
                value="${this._state.dateFrom ? he.encode(formatDate(this._state.dateFrom, DateFormat.DATE_PICKER)) : ''}"
              >
              &mdash;
              <label class="visually-hidden" for="event-end-time-1">To</label>
              <input
                class="event__input event__input--time"
                id="event-end-time-1"
                type="text"
                name="event-end-time"
                value="${this._state.dateTo ? he.encode(formatDate(this._state.dateTo, DateFormat.DATE_PICKER)) : ''}"
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
            <button class="event__save-btn btn btn--blue" type="button" ${this._state.isDisabled ? 'aria-disabled="true"' : ''}>
              ${this._state.isSaving ? ButtonText.SAVING : ButtonText.SAVE}
            </button>
            <button class="event__reset-btn" type="button" ${this._state.isDisabled ? 'aria-disabled="true"' : ''}>
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
    const saveBtn = element.querySelector('.event__save-btn');

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
    saveBtn.addEventListener('click', this.#onSaveButtonClick);

    document.removeEventListener('keydown', this.#escKeyDownHandler, true);

    this.#escKeyDownHandler = (evt) => {
      if (evt.key === 'Enter') {
        const isCalendarOpen = document.querySelector('.flatpickr-calendar.open');
        if (isCalendarOpen) {
          evt.preventDefault();
          evt.stopPropagation();

          if (this.#datepickerFrom && this.#datepickerFrom.isOpen) {
            this.#datepickerFrom.close();
          }

          if (this.#datepickerTo && this.#datepickerTo.isOpen) {
            this.#datepickerTo.close();
          }
        }
      }
    };

    document.addEventListener('keydown', this.#escKeyDownHandler, true);

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

    if (this.#escKeyDownHandler) {
      document.removeEventListener('keydown', this.#escKeyDownHandler, true);
      this.#escKeyDownHandler = null;
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
      isError: false,
      isNew: !point.id
    };
  }

  #parseStateToPoint() {
    const point = {...this._state};
    delete point.isDisabled;
    delete point.isSaving;
    delete point.isDeleting;
    delete point.isError;
    delete point.isNew;
    return point;
  }

  #setDatepickers() {
    const dateConfig = {
      dateFormat: 'd/m/y H:i',
      enableTime: true,
      locale: {
        firstDayOfWeek: 1,
      },
      'time_24hr': true,
      allowInput: true,
      clickOpens: true,
      closeOnSelect: false,
      disableMobile: true,
    };

    if (this.#datepickerFrom) {
      this.#datepickerFrom.destroy();
      this.#datepickerFrom = null;
    }

    if (this.#datepickerTo) {
      this.#datepickerTo.destroy();
      this.#datepickerTo = null;
    }

    const now = new Date();
    const defaultDateFrom = this._state.dateFrom ? new Date(this._state.dateFrom) : now;
    const defaultDateTo = this._state.dateTo ? new Date(this._state.dateTo) : new Date(now.getTime() + 60 * 60 * 1000);

    if ((this._state.id || (this._state.isSaving === false && !this._state.isNew)) && (!this._state.dateFrom || !this._state.dateTo)) {
      this._state.dateFrom = defaultDateFrom.toISOString();
      this._state.dateTo = defaultDateTo.toISOString();
    }

    const fromInput = this.element.querySelector('input[name="event-start-time"]');
    const toInput = this.element.querySelector('input[name="event-end-time"]');

    if (!this._state.id && this._state.isNew && !this._state.dateFrom && !this._state.dateTo) {
      fromInput.value = '';
      toInput.value = '';
    } else if (!this._state.id && this._state.dateFrom) {
      fromInput.value = formatDate(this._state.dateFrom, DateFormat.DATE_PICKER);
    }

    if (!this._state.id && this._state.dateTo) {
      toInput.value = formatDate(this._state.dateTo, DateFormat.DATE_PICKER);
    }

    this.#datepickerFrom = flatpickr(
      fromInput,
      {
        ...dateConfig,
        defaultDate: this.#getDefaultDateFrom(),
        onClose: this.#onDateFromChange,
        maxDate: this._state.dateTo ? new Date(this._state.dateTo) : null,
        onChange: (selectedDates) => {
          if (!this._state.id && selectedDates.length > 0) {
            fromInput.value = this.#datepickerFrom.formatDate(selectedDates[0], 'd/m/y H:i');
            this._state.dateFrom = selectedDates[0].toISOString();
          }
        }
      }
    );

    this.#datepickerTo = flatpickr(
      toInput,
      {
        ...dateConfig,
        defaultDate: this.#getDefaultDateTo(),
        onClose: this.#onDateToChange,
        minDate: this._state.dateFrom ? new Date(this._state.dateFrom) : null,
        onChange: (selectedDates) => {
          if (!this._state.id && selectedDates.length > 0) {
            toInput.value = this.#datepickerTo.formatDate(selectedDates[0], 'd/m/y H:i');
            this._state.dateTo = selectedDates[0].toISOString();
          }
        }
      }
    );

    fromInput.addEventListener('click', () => {
      if (this.#datepickerTo && this.#datepickerTo.isOpen) {
        this.#datepickerTo.close();
      }
    });

    toInput.addEventListener('click', () => {
      if (this.#datepickerFrom && this.#datepickerFrom.isOpen) {
        this.#datepickerFrom.close();
      }
    });

    this.#addDoneButtonToCalendar(this.#datepickerFrom);
    this.#addDoneButtonToCalendar(this.#datepickerTo);
  }

  #addDoneButtonToCalendar(datepicker) {
    if (!datepicker || !datepicker.calendarContainer) {
      return;
    }

    if (datepicker.calendarContainer.querySelector('.flatpickr-done-button')) {
      return;
    }

    const doneButton = document.createElement('button');
    doneButton.textContent = 'Готово';
    doneButton.className = 'flatpickr-done-button';
    doneButton.type = 'button';
    doneButton.style.cssText = 'margin: 5px auto; display: block; padding: 5px 10px; background: #3f51b5; color: white; border: none; border-radius: 4px; cursor: pointer;';

    doneButton.addEventListener('click', () => {
      datepicker.close();
    });

    datepicker.calendarContainer.appendChild(doneButton);
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

    if (!this._state.id) {
      this._state.dateFrom = userDate.toISOString();
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

    if (!this._state.id) {
      this._state.dateTo = userDate.toISOString();
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
      if (!this._state.id) {
        this._state.type = newType;
        this._state.offers = [];

        const typeIcon = this.element.querySelector('.event__type-icon');
        if (typeIcon) {
          typeIcon.src = `img/icons/${newType}.png`;
        }

        const typeOutput = this.element.querySelector('.event__type-output');
        if (typeOutput) {
          typeOutput.textContent = newType;
        }

        const detailsSection = this.element.querySelector('.event__details');
        if (detailsSection) {
          const offersMarkup = this.#generateOffersTemplate(newType);
          const destinationSection = detailsSection.querySelector('.event__section--destination');

          if (destinationSection) {
            detailsSection.innerHTML = `${offersMarkup}${destinationSection.outerHTML}`;
          } else {
            detailsSection.innerHTML = offersMarkup;
          }

          const availableOffers = detailsSection.querySelector('.event__available-offers');
          if (availableOffers) {
            const offerCheckboxes = availableOffers.querySelectorAll('.event__offer-checkbox');
            offerCheckboxes.forEach((checkbox) => {
              checkbox.addEventListener('change', this.#onOffersChange);
            });
          }
        }

        return;
      }

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

    if (!this._state.id) {
      if (destinationName === 'Empty destination') {
        this._state.destination = this.#destinations.find((dest) => dest.name === 'Empty destination')?.id || null;

        this.#updateDetailsSection();
        return;
      }

      if (!selectedDestination) {
        evt.target.value = '';
        return;
      }

      this._state.destination = selectedDestination.id;

      this.#updateDetailsSection();
      return;
    }

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

  #updateDetailsSection() {
    const detailsSection = this.element.querySelector('.event__details');
    if (!detailsSection) {
      return;
    }

    const offersMarkup = this.#generateOffersTemplate(this._state.type);
    const destinationData = this.#destinations.find((dest) => dest.id === this._state.destination);

    if (!destinationData || (destinationData.name === 'Empty destination' && !destinationData.description && (!destinationData.pictures || destinationData.pictures.length === 0))) {
      detailsSection.innerHTML = `<section class="event__details">${offersMarkup}</section>`;
    } else {
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

      detailsSection.innerHTML = `<section class="event__details">
        ${offersMarkup}
        ${destinationSectionMarkup}
      </section>`;
    }

    const availableOffers = detailsSection.querySelector('.event__available-offers');
    if (availableOffers) {
      const offerCheckboxes = availableOffers.querySelectorAll('.event__offer-checkbox');
      offerCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', this.#onOffersChange);
      });
    }
  }

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

    if (!this._state.id) {
      this._state.offers = currentOffers;
      return;
    }

    this.updateElement({
      offers: currentOffers
    });
  };

  #onBasePriceChange = (evt) => {
    evt.preventDefault();
    const price = parseInt(evt.target.value, 10);
    if (!isNaN(price) && price >= PriceConfig.MIN) {
      if (!this._state.id) {
        this._state.basePrice = price;
        return;
      }

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

  #onSaveButtonClick = (evt) => {
    evt.preventDefault();
    const point = this.#parseStateToPoint();

    const isDestinationValid = this.#destinations.some((dest) => dest.id === point.destination);

    const hasEmptyRequiredFields = !point.id && (
      !point.dateFrom ||
      !point.dateTo ||
      !isDestinationValid ||
      point.basePrice === undefined
    );

    const isPriceInvalid = point.basePrice !== undefined && point.basePrice < PriceConfig.MIN;

    if (hasEmptyRequiredFields || isPriceInvalid) {
      this.#showValidationError(point);
      return;
    }

    this.#handleFormSubmit(point);
  };

  #showValidationError(point) {
    this._state.isError = true;

    const fromInput = this.element.querySelector('input[name="event-start-time"]');
    const toInput = this.element.querySelector('input[name="event-end-time"]');
    const destinationInput = this.element.querySelector('input[name="event-destination"]');
    const priceInput = this.element.querySelector('input[name="event-price"]');

    if (fromInput && !point.dateFrom) {
      fromInput.style.borderColor = 'red';
      fromInput.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    }

    if (toInput && !point.dateTo) {
      toInput.style.borderColor = 'red';
      toInput.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    }

    if (destinationInput && !point.destination) {
      destinationInput.style.borderColor = 'red';
      destinationInput.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    }

    if (priceInput && (!point.basePrice || point.basePrice < PriceConfig.MIN)) {
      priceInput.style.borderColor = 'red';
      priceInput.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    }

    this.shake(() => {
      setTimeout(() => {
        const inputs = [fromInput, toInput, destinationInput, priceInput];
        inputs.forEach((input) => {
          if (input) {
            input.style.borderColor = '';
            input.style.backgroundColor = '';
          }
        });
        this._state.isError = false;
      }, 2000);
    });
  }

  setSaving() {
    if (!this._state.id) {
      const dateFrom = this._state.dateFrom;
      const dateTo = this._state.dateTo;

      this._state.isSaving = true;
      this._state.isDisabled = true;
      this._state.isNew = false;

      this._state.dateFrom = dateFrom;
      this._state.dateTo = dateTo;

      const saveButton = this.element.querySelector('.event__save-btn');
      if (saveButton) {
        saveButton.textContent = ButtonText.SAVING;
        saveButton.setAttribute('aria-disabled', 'true');
        saveButton.disabled = true;
      }

      const form = this.element.querySelector('form');
      if (form) {
        form.classList.add('disabled');

        const buttons = form.querySelectorAll('button');
        const inputs = form.querySelectorAll('input');
        const selects = form.querySelectorAll('select');
        const labels = form.querySelectorAll('label');

        buttons.forEach((button) => {
          button.setAttribute('aria-disabled', 'true');
          button.disabled = true;
          button.style.opacity = '0.5';
        });

        inputs.forEach((input) => {
          input.setAttribute('aria-disabled', 'true');
          input.disabled = true;
          input.style.opacity = '0.5';
        });

        selects.forEach((select) => {
          select.setAttribute('aria-disabled', 'true');
          select.disabled = true;
          select.style.opacity = '0.5';
        });

        labels.forEach((label) => {
          label.style.opacity = '0.5';
        });
      }
    } else {
      this.updateElement({
        isSaving: true,
        isDisabled: true
      });
    }
  }

  setDeleting() {
    const form = this.element.querySelector('form');
    if (form) {
      form.classList.add('disabled');

      const resetBtn = form.querySelector('.event__reset-btn');
      if (resetBtn) {
        resetBtn.textContent = ButtonText.DELETING;
        resetBtn.disabled = true;
        resetBtn.setAttribute('aria-disabled', 'true');
      }

      const buttons = form.querySelectorAll('button');
      const inputs = form.querySelectorAll('input');
      const selects = form.querySelectorAll('select');

      buttons.forEach((button) => {
        button.setAttribute('aria-disabled', 'true');
        button.disabled = true;
        button.style.opacity = '0.5';
      });

      inputs.forEach((input) => {
        input.setAttribute('aria-disabled', 'true');
        input.disabled = true;
        input.style.opacity = '0.5';
      });

      selects.forEach((select) => {
        select.setAttribute('aria-disabled', 'true');
        select.disabled = true;
        select.style.opacity = '0.5';
      });
    }

    this.updateElement({
      isDeleting: true,
      isDisabled: true
    });
  }

  setAborting() {
    const resetFormState = () => {
      const { dateFrom, dateTo } = this._state;

      this._state.isSaving = false;
      this._state.isDeleting = false;
      this._state.isDisabled = false;

      if (!this._state.id) {
        this._state.isNew = false;
        this._state.dateFrom = dateFrom;
        this._state.dateTo = dateTo;
      }

      const form = this.element.querySelector('form');
      if (form) {
        form.classList.remove('disabled');

        const buttons = form.querySelectorAll('button');
        const inputs = form.querySelectorAll('input');
        const selects = form.querySelectorAll('select');
        const labels = form.querySelectorAll('label');

        buttons.forEach((button) => {
          button.removeAttribute('aria-disabled');
          button.disabled = false;
          button.style.opacity = '1';
        });

        inputs.forEach((input) => {
          input.removeAttribute('aria-disabled');
          input.disabled = false;
          input.style.opacity = '1';
        });

        selects.forEach((select) => {
          select.removeAttribute('aria-disabled');
          select.disabled = false;
          select.style.opacity = '1';
        });

        labels.forEach((label) => {
          label.style.opacity = '1';
        });

        const saveButton = form.querySelector('.event__save-btn');
        if (saveButton) {
          saveButton.textContent = ButtonText.SAVE;
        }
      }

      if (!this._state.id) {
        this.#setDatepickers();
      } else {
        this.updateElement({
          isSaving: false,
          isDeleting: false,
          isDisabled: false,
          dateFrom,
          dateTo
        });
      }
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

  #getDefaultDateFrom() {
    if (this._state.isNew && !this._state.dateFrom) {
      return null;
    }
    return this._state.dateFrom ? new Date(this._state.dateFrom) : null;
  }

  #getDefaultDateTo() {
    if (this._state.isNew && !this._state.dateTo) {
      return null;
    }
    return this._state.dateTo ? new Date(this._state.dateTo) : null;
  }
}
