import AbstractView from '../framework/view/abstract-view.js';
import { EmptyListTexts, FilterType } from '../const.js';

export default class EmptyListView extends AbstractView {
  #filterType = null;

  constructor(filterType = FilterType.EVERYTHING) {
    super();
    this.#filterType = filterType;
  }

  get template() {
    const message = EmptyListTexts[this.#filterType] || EmptyListTexts[FilterType.EVERYTHING];

    return `
      <p class="trip-events__msg">${message}</p>
    `;
  }
}
