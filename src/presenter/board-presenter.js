import PointEditView from '../view/point-edit-view.js';
import BoardView from '../view/board-view.js';
import PointView from '../view/point-view.js';
import SortView from '../view/sort-view.js';
import EmptyListView from '../view/empty-list-view.js';
import { render, replace, remove } from '../framework/render.js';
import { filter, sort } from '../utils.js';
import { SortTypeEnabled } from '../const.js';

export default class BoardPresenter {
  #boardComponent = new BoardView();
  #container = null;
  #destinationsModel = null;
  #offersModel = null;
  #tripsModel = null;
  #filterModel = null;
  #sortModel = null;
  #pointEditComponent = null;
  #pointComponents = new Map();
  #emptyListComponent = null;
  #sortComponent = null;

  constructor({ container, destinationsModel, offersModel, tripsModel, filterModel, sortModel }) {
    this.#container = container;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
    this.#tripsModel = tripsModel;
    this.#filterModel = filterModel;
    this.#sortModel = sortModel;
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

  #onSortTypeChange = (sortType) => {
    this.#sortModel.setSortType(sortType);
    this.#clearBoard();
    this.#renderBoard();
  };

  get points() {
    const filterType = this.#filterModel.filterType;
    const points = this.#tripsModel.trips;
    const filteredPoints = filter[filterType](points);
    const sortType = this.#sortModel.sortType;

    return sort[sortType](filteredPoints);
  }

  #renderEmptyList() {
    this.#emptyListComponent = new EmptyListView({
      filterType: this.#filterModel.filterType
    });

    render(this.#emptyListComponent, this.#container);
  }

  #renderPoint(point) {
    const pointComponent = new PointView({
      point,
      destinations: this.#destinationsModel.destinations,
      offers: this.#offersModel.offers,
      onClick: () => this.#onPointClick(point)
    });

    this.#pointComponents.set(point.id, pointComponent);
    render(pointComponent, this.#boardComponent.element);
    pointComponent.setEventListeners();
  }

  #renderSort() {
    this.#sortComponent = new SortView({
      sortTypes: SortTypeEnabled,
      currentSortType: this.#sortModel.sortType,
      onSortTypeChange: this.#onSortTypeChange
    });
    render(this.#sortComponent, this.#container);
  }

  #renderBoard() {
    const points = this.points;

    if (points.length === 0) {
      this.#renderEmptyList();
      return;
    }

    this.#renderSort();
    render(this.#boardComponent, this.#container);

    points.forEach((point) => {
      this.#renderPoint(point);
    });
  }

  #clearBoard() {
    this.#pointComponents.forEach((component) => remove(component));
    this.#pointComponents.clear();

    if (this.#sortComponent) {
      remove(this.#sortComponent);
      this.#sortComponent = null;
    }

    if (this.#emptyListComponent) {
      remove(this.#emptyListComponent);
      this.#emptyListComponent = null;
    }

    if (this.#pointEditComponent) {
      remove(this.#pointEditComponent);
      this.#pointEditComponent = null;
    }
  }

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
    this.#clearBoard();
    this.#renderBoard();
  }
}
