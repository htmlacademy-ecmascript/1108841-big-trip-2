import BoardView from '../view/board-view.js';
import SortView from '../view/sort-view.js';
import EmptyListView from '../view/empty-list-view.js';
import LoadingView from '../view/loading-view.js';
import ErrorView from '../view/error-view.js';
import PointPresenter from './point-presenter.js';
import PointEditView from '../view/point-edit-view.js';
import { render, remove } from '../framework/render.js';
import { isPointFuture, isPointPresent, isPointPast } from '../utils/filter.js';
import { SortType, SortTypeEnabled, UserAction, UpdateType, FilterType, PointTypes, IdConfig } from '../const.js';
import dayjs from 'dayjs';

const generateId = () => Date.now().toString(IdConfig.RADIX) + Math.random().toString(IdConfig.RADIX).substring(IdConfig.LENGTH);

export default class BoardPresenter {
  #boardComponent = null;
  #container = null;
  #destinationsModel = null;
  #offersModel = null;
  #tripsModel = null;
  #filterModel = null;
  #sortModel = null;
  #pointPresenters = new Map();
  #emptyComponent = null;
  #sortComponent = null;
  #loadingComponent = null;
  #errorComponent = null;
  #isLoading = true;
  #currentSortType = null;
  #canCreatePoint = true;
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

    this.#tripsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
    this.#sortModel.addObserver(this.#handleModelEvent);
  }

  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#pointPresenters.get(data.id)?.init(data);
        break;
      case UpdateType.MINOR:
      case UpdateType.MAJOR:
        this.#refreshBoard();
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.init();
        break;
      default:
        throw new Error(`Unknown Update Type: ${updateType}`);
    }
  };

  #refreshBoard() {
    this.#clearBoard();
    this.#renderBoard(this.getPoints());
  }

  #setAbortingForPresenter(pointId) {
    const pointPresenter = this.#pointPresenters.get(pointId);
    if (pointPresenter) {
      pointPresenter.setAborting();
    }
  }

  #handlePointUpdate(update) {
    this.#tripsModel.updateTrip(update)
      .catch(() => {
        this.#setAbortingForPresenter(update.id);
      });
  }

  #prepareNewPointForSaving() {
    if (this.#newPointComponent) {
      this.#newPointComponent.updateElement({
        isSaving: true,
        isDisabled: true
      });
    }
  }

  #handleAddPointSuccess() {
    this.#handleNewPointFormClose();
    this.#isCreating = false;
    this.init();
  }

  #handleAddPointError() {
    if (this.#newPointComponent) {
      this.#newPointComponent.updateElement({
        isSaving: false,
        isDisabled: false
      });
      this.#newPointComponent.shake();
    }
  }

  #handlePointAdd(update) {
    this.#prepareNewPointForSaving();

    this.#tripsModel.addTrip(update)
      .then(() => {
        this.#handleAddPointSuccess();
      })
      .catch(() => {
        this.#handleAddPointError();
      });
  }

  #handlePointDelete(update) {
    this.#tripsModel.deleteTrip(update.id)
      .then(() => {
        this.init();
      })
      .catch(() => {
        this.#setAbortingForPresenter(update.id);
      });
  }

  #handleViewAction = (actionType, updateType, update) => {
    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#handlePointUpdate(update);
        break;
      case UserAction.ADD_POINT:
        this.#handlePointAdd(update);
        break;
      case UserAction.DELETE_POINT:
        this.#handlePointDelete(update);
        break;
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  };

  #handleModeChange = (pointId) => {
    if (this.#newPointComponent) {
      this.#handleNewPointFormClose();
    }

    this.#filterModel.setFilterType(FilterType.EVERYTHING, true);

    const activePointPresenter = this.#pointPresenters.get(pointId);

    this.#pointPresenters.forEach((presenter) => {
      if (presenter !== activePointPresenter) {
        presenter.resetView();
      }
    });
  };

  #onSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#sortModel.setSortType(sortType);
    this.#currentSortType = sortType;
    this.#clearPointsList();
    this.#renderPoints(this.getPoints());
  };

  getPoints() {
    const points = this.#tripsModel.trips;

    if (!points.length) {
      return [];
    }

    const filterType = this.#filterModel.filterType;
    const sortType = this.#sortModel.sortType;

    const filteredPoints = this.#filterPoints(points, filterType);
    return this.#sortPoints(filteredPoints, sortType);
  }

  #filterPoints(points, filterType) {
    // Проверяем и отфильтровываем невалидные точки
    const validPoints = points.filter((point) =>
      point && point.dateFrom && point.dateTo
    );

    switch (filterType) {
      case FilterType.EVERYTHING:
        return validPoints;
      case FilterType.FUTURE:
        return validPoints.filter((point) => isPointFuture(point));
      case FilterType.PRESENT:
        return validPoints.filter((point) => isPointPresent(point));
      case FilterType.PAST:
        return validPoints.filter((point) => isPointPast(point));
      default:
        return validPoints;
    }
  }

  #calculateEventDuration(point) {
    // Безопасный расчет длительности события
    if (!point || !point.dateFrom || !point.dateTo) {
      return 0;
    }
    return dayjs(point.dateTo).diff(dayjs(point.dateFrom));
  }

  #sortPoints(points, sortType) {
    // Проверяем и отфильтровываем невалидные точки
    const validPoints = points.filter((point) =>
      point && point.dateFrom && point.dateTo
    );

    switch (sortType) {
      case SortType.DAY:
        return validPoints.sort((pointA, pointB) => dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom)));
      case SortType.TIME:
        // Используем нашу безопасную функцию расчета длительности
        return validPoints.sort((pointA, pointB) => {
          const durationA = this.#calculateEventDuration(pointA);
          const durationB = this.#calculateEventDuration(pointB);

          // Если длительности равны, сортируем по дате начала
          if (durationA === durationB) {
            return dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom));
          }

          return durationB - durationA; // Сортировка по убыванию длительности
        });
      case SortType.PRICE:
        return validPoints.sort((pointA, pointB) => pointB.basePrice - pointA.basePrice);
      default:
        return validPoints;
    }
  }

  #renderEmptyList() {
    this.#emptyComponent = new EmptyListView({
      filterType: this.#filterModel.filterType
    });

    render(this.#emptyComponent, this.#container);
  }

  #renderPoint(point) {
    const pointPresenter = new PointPresenter({
      container: this.#boardComponent.element,
      destinations: this.#destinationsModel.destinations,
      offers: this.#offersModel.offers,
      onDataChange: this.#handleViewAction,
      onModeChange: this.#handleModeChange,
    });

    pointPresenter.init(point);
    this.#pointPresenters.set(point.id, pointPresenter);
  }

  #renderPoints(points) {
    points.forEach((point) => {
      this.#renderPoint(point);
    });
  }

  #renderSort() {
    this.#sortComponent = new SortView({
      sortTypes: SortTypeEnabled,
      currentSortType: this.#sortModel.sortType,
      onSortTypeChange: this.#onSortTypeChange
    });
    render(this.#sortComponent, this.#container);
  }

  #ensureBoardExists() {
    if (!this.#boardComponent) {
      this.#boardComponent = new BoardView();
      render(this.#boardComponent, this.#container);
      return true;
    }
    return false;
  }

  #renderBoard(points) {
    this.#renderSort();

    const isNewBoard = this.#ensureBoardExists();
    if (!isNewBoard) {
      render(this.#boardComponent, this.#container);
    }

    if (points.length === 0) {
      this.#renderEmptyList();
      return;
    }

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

    if (this.#emptyComponent) {
      remove(this.#emptyComponent);
      this.#emptyComponent = null;
    }

    remove(this.#boardComponent);
    this.#boardComponent = null;

    if (this.#loadingComponent) {
      remove(this.#loadingComponent);
      this.#loadingComponent = null;
    }

    if (this.#errorComponent) {
      remove(this.#errorComponent);
      this.#errorComponent = null;
    }
  }

  #prepareForNewPoint() {
    this.#filterModel.setFilterType(FilterType.EVERYTHING, true);
    this.resetSortType(true);

    if (this.#emptyComponent) {
      remove(this.#emptyComponent);
      this.#emptyComponent = null;
    }

    this.#handleModeChange();
    this.#ensureBoardExists();
  }

  #rerenderPointsIfNeeded() {
    const boardElement = this.#boardComponent.element;
    const hasNonEditingItems = boardElement &&
      !boardElement.querySelector('.trip-events__item:not(.trip-events__item--editing)');

    const shouldRerenderPoints =
      this.#pointPresenters.size > 0 && hasNonEditingItems;

    if (shouldRerenderPoints) {
      const points = this.getPoints();
      this.#clearPointsList();
      this.#renderPoints(points);
    }
  }

  #createNewPointComponent() {
    const newPoint = {
      id: generateId(),
      basePrice: 0,
      dateFrom: new Date().toISOString(),
      dateTo: new Date().toISOString(),
      destination: this.#destinationsModel.destinations[0]?.id || '',
      isFavorite: false,
      offers: [],
      type: PointTypes.ITEMS[0]
    };

    this.#newPointComponent = new PointEditView({
      point: newPoint,
      destinations: this.#destinationsModel.destinations,
      offers: this.#offersModel.offers,
      onSubmit: this.#handleViewAction.bind(this, UserAction.ADD_POINT, UpdateType.MINOR),
      onRollupClick: this.#handleNewPointFormClose,
      onDeleteClick: this.#handleNewPointFormClose
    });
  }

  #renderNewPointForm() {
    const boardElement = this.#boardComponent.element;
    render(this.#newPointComponent, boardElement, 'afterbegin');
    this.#newPointComponent.setEventListeners();
    document.addEventListener('keydown', this.#onEscKeyDownForNewPoint);
  }

  createPoint() {
    this.#prepareForNewPoint();
    this.#rerenderPointsIfNeeded();

    if (this.#newPointComponent !== null) {
      return;
    }

    this.#isCreating = true;
    this.#createNewPointComponent();
    this.#renderNewPointForm();
  }

  #handleNewPointFormClose = () => {
    if (!this.#newPointComponent) {
      return;
    }

    remove(this.#newPointComponent);
    this.#newPointComponent = null;
    this.#isCreating = false;

    document.removeEventListener('keydown', this.#onEscKeyDownForNewPoint);

    const points = this.getPoints();
    if (points.length > 0 && this.#pointPresenters.size === 0) {
      this.#renderPoints(points);
    }
  };

  #onEscKeyDownForNewPoint = (evt) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      this.#handleNewPointFormClose();
    }
  };

  resetSortType(silentUpdate = false) {
    this.#sortModel.setSortType(SortType.DAY, silentUpdate);
  }

  #restoreNewPointForm() {
    if (!this.#newPointComponent) {
      this.#createNewPointComponent();
      render(this.#newPointComponent, this.#boardComponent.element, 'afterbegin');
      this.#newPointComponent.setEventListeners();
      document.addEventListener('keydown', this.#onEscKeyDownForNewPoint);
    }
  }

  #renderLoading() {
    if (!this.#loadingComponent) {
      this.#loadingComponent = new LoadingView();
    }
    render(this.#loadingComponent, this.#container);
  }

  #renderError() {
    if (!this.#errorComponent) {
      this.#errorComponent = new ErrorView();
    }
    render(this.#errorComponent, this.#container);
  }

  #initNewPointForm() {
    if (this.#isCreating && this.#canCreatePoint) {
      this.createPoint();
    }
  }

  init() {
    this.#clearBoard();

    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    const points = this.getPoints();

    if (this.#destinationsModel.destinations.length === 0 || this.#offersModel.offers.length === 0) {
      this.#renderError();
      return;
    }

    if (points.length === 0) {
      this.#renderSort();
      this.#renderEmptyList();
      this.#initNewPointForm();
      return;
    }

    this.#renderBoard(points);
    this.#initNewPointForm();
  }

  setIsLoading(isLoading) {
    this.#isLoading = isLoading;
  }

  isCreating() {
    return this.#isCreating;
  }
}
