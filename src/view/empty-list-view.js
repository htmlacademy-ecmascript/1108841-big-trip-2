import AbstractView from '../framework/view/abstract-view.js';
import { FilterType } from '../const.js';
import './empty-list-view.css';

const NoPointsTextType = {
  [FilterType.EVERYTHING]: 'Click New Event to create your first point',
  [FilterType.FUTURE]: 'There are no future events now',
  [FilterType.PRESENT]: 'There are no present events now',
  [FilterType.PAST]: 'There are no past events now',
};

function createEmptyListTemplate(filterType, isCreating) {
  const noPointsTextValue = NoPointsTextType[filterType];

  return `<p class="trip-events__msg ${isCreating ? 'trip-events__msg--creating' : ''}">
    ${isCreating ? 'Creating a new point...' : noPointsTextValue}
  </p>`;
}

export default class EmptyListView extends AbstractView {
  #filterType = null;
  #isCreating = false;

  constructor({filterType, isCreating = false}) {
    super();
    this.#filterType = filterType;
    this.#isCreating = isCreating;
  }

  get template() {
    return createEmptyListTemplate(this.#filterType, this.#isCreating);
  }

  setCreating(isCreating) {
    this.#isCreating = isCreating;

    // Обновляем DOM напрямую для тестов
    const msgElement = this.element;
    if (msgElement) {
      if (isCreating) {
        msgElement.classList.add('trip-events__msg--creating');
        msgElement.textContent = 'Creating a new point...';
      } else {
        msgElement.classList.remove('trip-events__msg--creating');
        msgElement.textContent = NoPointsTextType[this.#filterType];
      }
    }
  }
}
