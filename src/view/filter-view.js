import AbstractView from '../framework/view/abstract-view.js';

export default class FilterView extends AbstractView {
  #filters = null;
  #currentFilter = null;
  #handleFilterTypeChange = null;

  constructor({filters, currentFilterType, onFilterTypeChange}) {
    super();
    this.#filters = filters;
    this.#currentFilter = currentFilterType;
    this.#handleFilterTypeChange = onFilterTypeChange;

    this.element.addEventListener('change', this.#filterTypeChangeHandler);
  }

  get template() {
    return `<form class="trip-filters" action="#" method="get">
      ${Object.entries(this.#filters).map(([filterType, isEnabled]) => this.#createFilterItemTemplate(filterType, isEnabled)).join('')}
      <button class="visually-hidden" type="submit">Accept filter</button>
    </form>`;
  }

  #createFilterItemTemplate(filterType, isEnabled) {
    const checked = filterType === this.#currentFilter ? 'checked' : '';
    const disabled = isEnabled ? '' : 'disabled';

    return `<div class="trip-filters__filter">
      <input id="filter-${filterType}"
        class="trip-filters__filter-input  visually-hidden"
        type="radio"
        name="trip-filter"
        value="${filterType}"
        ${checked}
        ${disabled}>
      <label class="trip-filters__filter-label" for="filter-${filterType}">${filterType}</label>
    </div>`;
  }

  #filterTypeChangeHandler = (evt) => {
    evt.preventDefault();
    this.#handleFilterTypeChange(evt.target.value);
  };
}
