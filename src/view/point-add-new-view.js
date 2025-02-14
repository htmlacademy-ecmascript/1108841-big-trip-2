import { createElement } from '../render.js';
import { createPointEditTemplate } from './point-edit-view.js';

export default class PointAddNewView {
  #element = null;
  #destinations = null;
  #offers = null;

  constructor(destinations, offers) {
    this.#destinations = destinations;
    this.#offers = offers;
  }

  get template() {
    return createPointEditTemplate(null, this.#destinations, this.#offers);
  }

  get element() {
    if (!this.#element) {
      this.#element = createElement(this.template);
    }

    return this.#element;
  }

  removeElement() {
    this.#element = null;
  }
}
