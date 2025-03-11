import AbstractView from '../framework/view/abstract-view.js';
import { DEFAULT_ERROR_MESSAGE } from '../const.js';

const generateErrorTemplate = (message) => (
  `<p class="trip-events__msg">
    ${message || DEFAULT_ERROR_MESSAGE}
  </p>`
);

export default class ErrorView extends AbstractView {
  #message = null;

  constructor({ message } = {}) {
    super();
    this.#message = message;
  }

  get template() {
    return generateErrorTemplate(this.#message);
  }
}
