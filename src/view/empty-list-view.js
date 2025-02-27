import AbstractView from '../framework/view/abstract-view.js';
import { EmptyListMessage } from '../const.js';

export default class EmptyListView extends AbstractView {
  #filterType = null;

  constructor({filterType}) {
    super();
    this.#filterType = filterType;
  }

  get template() {
    return `<p class="trip-events__msg">${EmptyListMessage[this.#filterType]}</p>`;
  }
}
