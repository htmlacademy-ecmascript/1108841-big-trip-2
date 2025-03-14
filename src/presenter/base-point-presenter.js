import { removeKeydownHandler } from '../utils/common.js';

export default class BasePointPresenter {
  #pointEditComponent = null;
  #handleDataChange = null;

  constructor({ onDataChange }) {
    this.#handleDataChange = onDataChange;
  }

  get pointEditComponent() {
    return this.#pointEditComponent;
  }

  set pointEditComponent(component) {
    this.#pointEditComponent = component;
  }

  get handleDataChange() {
    return this.#handleDataChange;
  }

  destroy() {
    if (this.#pointEditComponent) {
      removeKeydownHandler(this.#escKeyDownHandler);
    }
  }

  #escKeyDownHandler = () => {
    throw new Error('Abstract method not implemented: escKeyDownHandler');
  };
}
