import BoardView from '../view/board-view.js';
import SortView from '../view/sort-view.js';
import EmptyListView from '../view/empty-list-view.js';
import PointPresenter from './point-presenter.js';
import PointEditView from '../view/point-edit-view.js';
import { render, remove } from '../framework/render.js';
import { filter, sort } from '../utils.js';
import { SortType, SortTypeEnabled, UserAction, UpdateType, FilterType, POINT_TYPES } from '../const.js';

// Генерация уникального ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

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
  #isCreating = false;
  #newPointComponent = null;

  constructor({ container, destinationsModel, offersModel, tripsModel, filterModel, sortModel }) {
    this.#container = container;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
    this.#tripsModel = tripsModel;
    this.#filterModel = filterModel;
    this.#sortModel = sortModel;
    this.#currentSortType = this.#sortModel.sortType;
  }

  #handleViewAction = (actionType, updateType, update) => {
    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#tripsModel.updateTrip(update);

        // PATCH - обновление без перерисовки
        // FORCE - принудительная перерисовка без обновления всей доски
        if (updateType === UpdateType.FORCE) {
          // Восстанавливаем все точки в списке
          const points = this.points;
          this.#clearPointsList();
          this.#renderPoints(points);
        } else if (updateType !== UpdateType.PATCH) {
          this.init();
        }
        break;
      case UserAction.ADD_POINT:
        this.#tripsModel.addTrip(update);
        this.#handleNewPointFormClose();
        this.init();
        break;
      case UserAction.DELETE_POINT:
        this.#tripsModel.deleteTrip(update.id);
        this.init();
        break;
    }
  };

  #handleModeChange = (pointId) => {
    if (this.#newPointComponent) {
      this.#handleNewPointFormClose();
    }

    this.#pointPresenters.forEach((presenter) => {
      if (presenter && presenter !== this.#pointPresenters.get(pointId)) {
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
      onDataChange: this.#handleViewAction,
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

  createPoint() {
    this.#filterModel.setFilterType(FilterType.EVERYTHING);
    this.resetSortType();

    // Закрываем формы редактирования и восстанавливаем список точек
    this.#handleModeChange();

    // Проверяем, нужно ли перерисовать список точек
    if (this.#pointPresenters.size > 0 && !this.#boardComponent.element.querySelector('.trip-events__item:not(.trip-events__item--editing)')) {
      const points = this.points;
      this.#clearPointsList();
      this.#renderPoints(points);
    }

    if (this.#newPointComponent !== null) {
      return;
    }

    this.#isCreating = true;

    // Создаём пустую точку маршрута
    const newPoint = {
      id: generateId(),
      basePrice: 0,
      dateFrom: new Date().toISOString(),
      dateTo: new Date().toISOString(),
      destination: this.#destinationsModel.destinations[0]?.id || '',
      isFavorite: false,
      offers: [],
      type: POINT_TYPES[0]
    };

    this.#newPointComponent = new PointEditView({
      point: newPoint,
      destinations: this.#destinationsModel.destinations,
      offers: this.#offersModel.offers,
      onSubmit: this.#handleViewAction.bind(this, UserAction.ADD_POINT, UpdateType.MINOR),
      onRollupClick: this.#handleNewPointFormClose,
      onDeleteClick: this.#handleNewPointFormClose
    });

    render(this.#newPointComponent, this.#boardComponent.element, 'afterbegin');
    this.#newPointComponent.setEventListeners();
    document.addEventListener('keydown', this.#escKeyDownHandler);
  }

  #handleNewPointFormClose = () => {
    if (!this.#newPointComponent) {
      return;
    }

    remove(this.#newPointComponent);
    this.#newPointComponent = null;
    this.#isCreating = false;

    document.removeEventListener('keydown', this.#escKeyDownHandler);

    // Перерисовываем список точек после закрытия формы создания новой точки
    const points = this.points;
    this.#clearPointsList();
    this.#renderPoints(points);
  };

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      this.#handleNewPointFormClose();
    }
  };

  resetSortType() {
    this.#sortModel.setSortType(SortType.DAY);
  }

  init() {
    this.#clearBoard();
    const points = this.points;
    this.#renderBoard(points);
  }
}
