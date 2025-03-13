import AbstractView from '../framework/view/abstract-view.js';
import { EmptyListTexts, FilterType } from '../const.js';

export default class EmptyListView extends AbstractView {
  #filterType = null;
  #isCreatingNewPoint = false;

  constructor({ filterType = FilterType.EVERYTHING, isCreatingNewPoint = false } = {}) {
    super();
    this.#filterType = filterType;
    this.#isCreatingNewPoint = isCreatingNewPoint;
  }

  get template() {
    if (this.#isCreatingNewPoint) {
      return '<p class="trip-events__msg" style="display: none;"></p>';
    }

    const message = EmptyListTexts[this.#filterType] || EmptyListTexts[FilterType.EVERYTHING];

    return `
      <p class="trip-events__msg">${message}</p>
    `;
  }
}
