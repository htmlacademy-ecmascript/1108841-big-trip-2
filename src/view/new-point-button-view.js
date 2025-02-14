import AbstractView from '../framework/view/abstract-view.js';

export default class NewPointButtonView extends AbstractView {
  get template() {
    return '<button class="trip-main__event-add-btn  btn  btn--big  btn--yellow" type="button">New event</button>';
  }
}
