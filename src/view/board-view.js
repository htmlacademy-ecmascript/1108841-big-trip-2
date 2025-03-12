import AbstractView from '../framework/view/abstract-view.js';

export default class BoardView extends AbstractView {
  get template() {
    return '<ul class="trip-events__list"></ul>';
  }

  hasNonEditingItems() {
    return !this.element.querySelector('.trip-events__item:not(.trip-events__item--editing)');
  }
}
