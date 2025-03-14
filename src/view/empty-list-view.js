import AbstractView from '../framework/view/abstract-view.js';
import { FilterType, EmptyListTexts } from '../const.js';

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

    if (isCreating) {
      this.element.classList.add('trip-events__msg--creating');
      this.element.textContent = 'Creating a new point...';
    } else {
      this.element.classList.remove('trip-events__msg--creating');
      this.element.textContent = EmptyListTexts[this.#filterType];
    }
  }
}
