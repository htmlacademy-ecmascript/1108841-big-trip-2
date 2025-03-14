import AbstractView from '../framework/view/abstract-view.js';
import { SortType, SortLabel } from '../const.js';
export default class SortView extends AbstractView {
  #sortTypes = null;
  #currentSortType = null;
  #handleSortTypeChange = null;
  constructor({sortTypes, currentSortType, onSortTypeChange}) {
    super();
    this.#sortTypes = sortTypes;
    this.#currentSortType = currentSortType;
    this.#handleSortTypeChange = onSortTypeChange;
    this.element.addEventListener('change', this.#onSortTypeChange);
  }

  get template() {
    return `<form class="trip-events__trip-sort  trip-sort" action="#" method="get">
      ${Object.entries(this.#sortTypes).map(([sortType, isEnabled]) => this.#createSortItemTemplate(sortType, isEnabled)).join('')}
    </form>`;
  }

  #createSortItemTemplate(sortType, isEnabled) {
    const checked = sortType === this.#currentSortType ? 'checked' : '';
    const disabled = isEnabled ? '' : 'disabled';
    return `<div class="trip-sort__item  trip-sort__item--${sortType}">
      <input id="sort-${sortType}"
        class="trip-sort__input  visually-hidden"
        type="radio"
        name="trip-sort"
        value="sort-${sortType}"
        data-sort-type="${sortType}"
        ${checked}
        ${disabled}>
      <label class="trip-sort__btn" for="sort-${sortType}" data-sort-type="${sortType}">${this.#getSortLabel(sortType)}</label>
    </div>`;
  }

  #getSortLabel(sortType) {
    const sortLabels = {
      [SortType.DAY]: SortLabel.DAY,
      [SortType.EVENT]: SortLabel.EVENT,
      [SortType.TIME]: SortLabel.TIME,
      [SortType.PRICE]: SortLabel.PRICE,
      [SortType.OFFER]: SortLabel.OFFER
    };

    return sortLabels[sortType] || sortType;
  }

  #onSortTypeChange = (evt) => {
    if (evt.target.tagName !== 'INPUT') {
      return;
    }
    evt.preventDefault();
    this.#handleSortTypeChange(evt.target.getAttribute('data-sort-type'));
  };
}
