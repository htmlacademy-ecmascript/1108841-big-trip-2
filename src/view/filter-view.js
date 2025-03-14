import AbstractView from '../framework/view/abstract-view.js';
export default class FilterView extends AbstractView {
  #filters = null;
  #currentFilterType = null;
  #handleFilterTypeChange = null;
  constructor({ filters, currentFilterType, onFilterTypeChange }) {
    super();
    this.#filters = filters;
    this.#currentFilterType = currentFilterType;
    this.#handleFilterTypeChange = onFilterTypeChange;
    this._restoreHandlers();
  }

  get template() {
    return `<form class="trip-filters" action="#" method="get">
      ${this.#createFiltersTemplate()}
      <button class="visually-hidden" type="submit">Accept filter</button>
    </form>`;
  }

  updateFilter(filterType) {
    this.#currentFilterType = filterType;
    const filterInputs = this.element.querySelectorAll('.trip-filters__filter-input');
    filterInputs.forEach((input) => {
      input.checked = false;
    });
    const activeFilter = this.element.querySelector(`#filter-${filterType}`);
    if (activeFilter) {
      activeFilter.checked = true;
    }
  }

  _restoreHandlers() {
    this.element.addEventListener('change', this.#onFilterTypeChange);
  }

  #createFiltersTemplate() {
    return this.#filters.map(({ type, name, disabled }) => `
      <div class="trip-filters__filter">
        <input
          id="filter-${type}"
          class="trip-filters__filter-input  visually-hidden"
          type="radio"
          name="trip-filter"
          value="${type}"
          ${type === this.#currentFilterType ? 'checked' : ''}
          ${disabled ? 'disabled' : ''}
        >
        <label
          class="trip-filters__filter-label"
          for="filter-${type}"
        >${name}</label>
      </div>`).join('');
  }

  #onFilterTypeChange = (evt) => {
    if (evt.target.tagName !== 'INPUT') {
      return;
    }
    const filterType = evt.target.value;

    // Устанавливаем checked для выбранного фильтра
    evt.target.checked = true;

    // Обновляем фильтр в представлении
    this.updateFilter(filterType);

    // Вызываем обработчик изменения фильтра
    this.#handleFilterTypeChange(filterType);
  };
}
