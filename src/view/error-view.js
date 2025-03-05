import AbstractView from '../framework/view/abstract-view.js';

const createErrorTemplate = (message) => (
  `<p class="trip-events__msg">
    ${message || 'Something went wrong...'}
  </p>`
);

export default class ErrorView extends AbstractView {
  #message = null;

  constructor({ message } = {}) {
    super();
    this.#message = message;
  }

  get template() {
    return createErrorTemplate(this.#message);
  }
}
