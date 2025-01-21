import PointEditView from '../view/point-edit-view.js';
import BoardView from '../view/board-view.js';
import PointView from '../view/point-view.js';
import SortView from '../view/sort-view.js';
import { render } from '../render.js';

const POINTS = 3;

export default class BoardPresenter {
  #boardComponent = new BoardView();
  #container = null;

  constructor(container) {
    this.#container = container;
  }

  init() {
    render(new SortView(), this.#container);
    render(this.#boardComponent, this.#container);
    render(new PointEditView(), this.#boardComponent.getElement());

    for (let i = 0; i < POINTS; i++) {
      render(new PointView(), this.#boardComponent.getElement());
    }
  }
}
