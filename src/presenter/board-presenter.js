import PointEditView from '../view/point-edit-view.js';
import BoardView from '../view/board-view.js';
import PointView from '../view/point-view.js';
import SortView from '../view/sort-view.js';
import { render, replace } from '../framework/render.js';

export default class BoardPresenter {
  #boardComponent = new BoardView();
  #container = null;
  #destinationsModel = null;
  #offersModel = null;
  #tripsModel = null;
  #pointEditComponent = null;
  #pointComponents = new Map();

  constructor({ container, destinationsModel, offersModel, tripsModel }) {
    this.#container = container;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
    this.#tripsModel = tripsModel;
  }

  #onDocumentEscKeydown = (evt) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      this.#replaceFormToPoint();
      document.removeEventListener('keydown', this.#onDocumentEscKeydown);
    }
  };

  #onPointClick = (point) => {
    this.#replacePointToForm(point);
  };

  #onFormSubmit = () => {
    this.#replaceFormToPoint();
  };

  #onFormRollupClick = () => {
    this.#replaceFormToPoint();
  };

  #replacePointToForm(point) {
    if (this.#pointEditComponent) {
      this.#replaceFormToPoint();
    }

    const pointComponent = this.#pointComponents.get(point.id);

    this.#pointEditComponent = new PointEditView({
      point,
      destinations: this.#destinationsModel.destinations,
      offers: this.#offersModel.offers,
      onSubmit: this.#onFormSubmit,
      onRollupClick: this.#onFormRollupClick
    });

    replace(this.#pointEditComponent, pointComponent);
    this.#pointEditComponent.setEventListeners();
    document.addEventListener('keydown', this.#onDocumentEscKeydown);
  }

  #replaceFormToPoint() {
    if (this.#pointEditComponent === null) {
      return;
    }

    const point = this.#pointEditComponent.point;
    const pointComponent = this.#pointComponents.get(point.id);

    replace(pointComponent, this.#pointEditComponent);
    this.#pointEditComponent = null;
    document.removeEventListener('keydown', this.#onDocumentEscKeydown);
  }

  init() {
    const points = this.#tripsModel.trips;
    const destinations = this.#destinationsModel.destinations;
    const offers = this.#offersModel.offers;

    render(new SortView(), this.#container);
    render(this.#boardComponent, this.#container);

    points.forEach((point) => {
      const pointComponent = new PointView({
        point,
        destinations,
        offers,
        onClick: () => this.#onPointClick(point)
      });

      this.#pointComponents.set(point.id, pointComponent);
      render(pointComponent, this.#boardComponent.element);
      pointComponent.setEventListeners();
    });
  }
}
