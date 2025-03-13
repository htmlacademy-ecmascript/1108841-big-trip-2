import AbstractView from '../framework/view/abstract-view.js';

export default class ErrorView extends AbstractView {
  get template() {
    return '<p class="trip-events__msg">Failed to load latest route information</p>';
  }
}
