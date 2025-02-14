import PointEditView from '../view/point-edit-view.js';
import BoardView from '../view/board-view.js';
import PointView from '../view/point-view.js';
import SortView from '../view/sort-view.js';
import { render } from '../render.js';

export default class BoardPresenter {
  #boardComponent = new BoardView();
  #container = null;
  #destinationsModel = null;
  #offersModel = null;
  #tripsModel = null;

  constructor({ container, destinationsModel, offersModel, tripsModel }) {
    this.#container = container;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
    this.#tripsModel = tripsModel;
  }

  init() {
    const points = this.#tripsModel.trips;
    const destinations = this.#destinationsModel.destinations;
    const offers = this.#offersModel.offers;

    console.log('BoardPresenter init:', { points, destinations, offers }); // Для отладки

    render(new SortView(), this.#container);
    render(this.#boardComponent, this.#container);

    // Отображаем форму редактирования для первой точки
    if (points.length > 0) {
      console.log('Rendering first point:', points[0]); // Для отладки
      render(
        new PointEditView(
          points[0],
          destinations,
          offers
        ),
        this.#boardComponent.element
      );
    }

    // Отображаем остальные точки
    for (let i = 1; i < points.length; i++) {
      console.log('Rendering point:', points[i]); // Для отладки
      render(
        new PointView(
          points[i],
          destinations,
          offers
        ),
        this.#boardComponent.element
      );
    }
  }
}
