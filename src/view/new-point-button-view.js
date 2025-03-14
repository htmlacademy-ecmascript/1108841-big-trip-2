import AbstractView from '../framework/view/abstract-view.js';
export default class NewPointButtonView extends AbstractView {
  #handleClick = null;
  constructor({onClick}) {
    super();
    this.#handleClick = onClick;
    this.element.addEventListener('click', this.#onButtonClick);
  }

  get template() {
    return '<button class="trip-main__event-add-btn  btn  btn--big  btn--yellow" type="button">New event</button>';
  }

  setDisabled(isDisabled) {
    this.element.disabled = isDisabled;
  }

  #onButtonClick = (evt) => {
    evt.preventDefault();
    this.#handleClick();
  };
}
