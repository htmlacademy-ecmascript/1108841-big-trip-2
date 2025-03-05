import BoardView from '../view/board-view.js';
import SortView from '../view/sort-view.js';
import EmptyListView from '../view/empty-list-view.js';
import PointPresenter from './point-presenter.js';
import { render, remove } from '../framework/render.js';
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
  #pointPresenters = new Map();
  #emptyListComponent = null;
  #sortComponent = null;
  #currentSortType = null;

  constructor({ container, destinationsModel, offersModel, tripsModel, filterModel, sortModel }) {
    this.#container = container;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
    this.#tripsModel = tripsModel;
    this.#filterModel = filterModel;
    this.#sortModel = sortModel;
    this.#currentSortType = this.#sortModel.sortType;
  }

  #handleModeChange = (currentPointId) => {
    this.#pointPresenters.forEach((presenter, pointId) => {
      if (pointId !== currentPointId) {
        presenter.resetView();
      }
    });
  };

  #handlePointChange = (updatedPoint) => {
    try {
      if (this.#tripsModel.updateTrip(updatedPoint)) {
        this.#clearBoard();
        this.#renderBoard(this.points);
      }
    } catch (error) {
      this.#clearBoard();
      this.#renderBoard(this.points);
    }
  };

  #onSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#sortModel.setSortType(sortType);
    this.#currentSortType = sortType;
    this.#clearPointsList();
    this.#renderPoints(this.points);
  };

  get points() {
    const filterType = this.#filterModel.filterType;
    const points = this.#tripsModel.trips;

    if (!Array.isArray(points) || points.length === 0) {
      return [];
    }

    const filteredPoints = filter[filterType](points);
    const sortType = this.#sortModel.sortType;
    const sortedPoints = sort[sortType](filteredPoints);
    return sortedPoints;
  }

  #renderEmptyList() {
    this.#emptyListComponent = new EmptyListView({
      filterType: this.#filterModel.filterType
    });

    render(this.#emptyListComponent, this.#container);
  }

  #renderPoint(point) {
    const pointPresenter = new PointPresenter({
      container: this.#boardComponent.element,
      destinations: this.#destinationsModel.destinations,
      offers: this.#offersModel.offers,
      onDataChange: this.#handlePointChange,
      onModeChange: this.#handleModeChange
    });

    pointPresenter.init(point);
    this.#pointPresenters.set(point.id, pointPresenter);
  }

  #renderPoints(points) {
    points.forEach((point) => this.#renderPoint(point));
  }

  #renderSort() {
    this.#sortComponent = new SortView({
      sortTypes: SortTypeEnabled,
      currentSortType: this.#sortModel.sortType,
      onSortTypeChange: this.#onSortTypeChange
    });
    render(this.#sortComponent, this.#container);
  }

  #renderBoard(points) {
    if (!Array.isArray(points) || points.length === 0) {
      this.#renderEmptyList();
      return;
    }

    this.#renderSort();
    render(this.#boardComponent, this.#container);
    this.#renderPoints(points);
  }

  #clearPointsList() {
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();
  }

  #clearBoard() {
    this.#clearPointsList();

    if (this.#sortComponent) {
      remove(this.#sortComponent);
      this.#sortComponent = null;
    }

    if (this.#emptyListComponent) {
      remove(this.#emptyListComponent);
      this.#emptyListComponent = null;
    }
  }

  init() {
    this.#clearBoard();
    const points = this.points;
    this.#renderBoard(points);
  }
}
