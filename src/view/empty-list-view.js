import AbstractView from '../framework/view/abstract-view.js';
import { FilterType, EmptyListTexts } from '../const.js';
import './empty-list-view.css';

function createEmptyListTemplate(filterType, isCreating) {
  const noPointsTextValue = EmptyListTexts[filterType];

  return `<p class="trip-events__msg">
    ${isCreating ? 'Creating a new point...' : noPointsTextValue}
  </p>`;
}

export default class EmptyListView extends AbstractView {
  #filterType = null;
  #isCreating = false;

  constructor({filterType, isCreatingNewPoint = false}) {
    super();
    this.#filterType = filterType;
    this.#isCreating = isCreatingNewPoint;
  }

  get template() {
    return createEmptyListTemplate(this.#filterType, this.#isCreating);
  }

  setCreating(isCreating) {
    this.#isCreating = isCreating;
    this.element.textContent = isCreating ? 'Creating a new point...' : EmptyListTexts[this.#filterType];
  }
}
