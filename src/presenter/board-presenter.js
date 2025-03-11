import BoardView from '../view/board-view.js';
import SortView from '../view/sort-view.js';
import EmptyListView from '../view/empty-list-view.js';
import LoadingView from '../view/loading-view.js';
import ErrorView from '../view/error-view.js';
import PointPresenter from './point-presenter.js';
import PointEditView from '../view/point-edit-view.js';
import { render, remove } from '../framework/render.js';
import { filter } from '../utils/filter.js';
import { sort } from '../utils/sort.js';
import { SortType, SortTypeEnabled, UserAction, UpdateType, FilterType, POINT_TYPE_ITEMS, RADIX, ID_LENGTH } from '../const.js';

const generateId = () => Date.now().toString(RADIX) + Math.random().toString(RADIX).substring(ID_LENGTH);

export default class BoardPresenter {
  #boardComponent = new BoardView();
  #container = null;
  #destinationsModel = null;
  #offersModel = null;
  #tripsModel = null;
  #filterModel = null;
  #sortModel = null;
  #pointPresenters = new Map();
  #emptyComponent = null;
  #sortComponent = null;
  #loadingComponent = new LoadingView();
  #errorComponent = null;
  #isLoading = true;
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
        this.init();
        break;
      case UpdateType.MAJOR:
        this.init();
        break;
      case UpdateType.FORCE:
        {
          const allPoints = this.#tripsModel.trips;

          this.#clearPointsList();

          allPoints.forEach((point) => this.#renderPoint(point));
        }
        break;
    }
  };

  #handleViewAction = async (actionType, updateType, update) => {
    if (actionType === UserAction.UPDATE_POINT && updateType === UpdateType.MINOR &&
        !document.querySelector('.event--edit')) {
      this.#clearPointsList();
      this.#renderPoints(this.getPoints);
      return;
    }

    if (actionType === UserAction.UPDATE_POINT && updateType === UpdateType.FORCE) {
      return;
    }

    try {
      switch (actionType) {
        case UserAction.UPDATE_POINT: {
          const pointPresenter = this.#pointPresenters.get(update.id);
          if (pointPresenter) {
            pointPresenter.setSaving();
          }
          await this.#tripsModel.updateTrip(updateType, update);
          break;
        }
        case UserAction.ADD_POINT: {
          if (this.#newPointComponent) {
            this.#newPointComponent.updateElement({
              isSaving: true,
              isDisabled: true
            });
          }
          await this.#tripsModel.addTrip(updateType, update);
          this.#handleNewPointFormClose();
          break;
        }
        case UserAction.DELETE_POINT: {
          const deletePresenter = this.#pointPresenters.get(update.id);
          if (deletePresenter) {
            deletePresenter.setDeleting();
          }
          await this.#tripsModel.deleteTrip(updateType, update.id);
          break;
        }
      }
    } catch (err) {
      switch (actionType) {
        case UserAction.UPDATE_POINT: {
          const pointPresenter = this.#pointPresenters.get(update.id);
          if (pointPresenter) {
            pointPresenter.setAborting();
          }
          break;
        }
        case UserAction.ADD_POINT: {
          if (this.#newPointComponent) {
            this.#newPointComponent.updateElement({
              isSaving: false,
              isDisabled: false,
              isError: true,
              errorMessage: 'Не удалось создать точку маршрута'
            });
            this.#newPointComponent.shake();
          }
          break;
        }
        case UserAction.DELETE_POINT: {
          const deletePresenter = this.#pointPresenters.get(update.id);
          if (deletePresenter) {
            deletePresenter.setAborting();
          }
          break;
        }
      }
    } finally {
      if (actionType === UserAction.ADD_POINT) {
        document.querySelector('.trip-main__event-add-btn').disabled = false;
      }
    }
  };

  #handleModeChange = (pointId) => {
    if (this.#newPointComponent) {
      this.#handleNewPointFormClose();
    }

    this.#filterModel.setFilterType(FilterType.EVERYTHING);

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
        this.#renderBoard(this.getPoints);
      }
    } catch (error) {
      this.#clearBoard();
      this.#renderBoard(this.getPoints);
    }
  };

  #onSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#sortModel.setSortType(sortType);
    this.#currentSortType = sortType;
    this.#clearPointsList();
    this.#renderPoints(this.getPoints);
  };

  get getPoints() {
    if (document.querySelector('.event--edit')) {
      return this.#tripsModel.trips;
    }

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
    this.#renderSort();

    if (!this.#boardComponent) {
      this.#boardComponent = new BoardView();
    }
    render(this.#boardComponent, this.#container);

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

  createPoint() {
    this.#filterModel.setFilterType(FilterType.EVERYTHING);
    this.resetSortType();

    if (this.#emptyComponent) {
      remove(this.#emptyComponent);
      this.#emptyComponent = null;
    }

    this.#handleModeChange();

    if (!this.#boardComponent) {
      this.#boardComponent = new BoardView();
      render(this.#boardComponent, this.#container);
    }

    if (this.#pointPresenters.size > 0 && this.#boardComponent.element && !this.#boardComponent.element.querySelector('.trip-events__item:not(.trip-events__item--editing)')) {
      const points = this.getPoints;
      this.#clearPointsList();
      this.#renderPoints(points);
    }

    if (this.#newPointComponent !== null) {
      return;
    }

    this.#isCreating = true;

    const newPoint = {
      id: generateId(),
      basePrice: 0,
      dateFrom: new Date().toISOString(),
      dateTo: new Date().toISOString(),
      destination: this.#destinationsModel.destinations[0]?.id || '',
      isFavorite: false,
      offers: [],
      type: POINT_TYPE_ITEMS[0]
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

    const points = this.getPoints;
    if (points.length > 0 && this.#pointPresenters.size === 0) {
      this.#renderPoints(points);
    }
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

    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    const points = this.getPoints;

    if (this.#isCreating) {
      render(this.#boardComponent, this.#container);
      return;
    }

    if (points.length === 0 && !this.#isCreating) {
      this.#renderEmptyList();
      return;
    }

    this.#renderBoard(points);

    if (this.#pointPresenters.size === 0 && points.length > 0) {
      points.forEach((point) => this.#renderPoint(point));
    }
  }

  #renderLoading() {
    this.#loadingComponent = new LoadingView();
    render(this.#loadingComponent, this.#container);
  }

  renderError(message) {
    this.#errorComponent = new ErrorView({ message });
    render(this.#errorComponent, this.#container);
  }

  setIsLoading(isLoading) {
    this.#isLoading = isLoading;
  }
}
