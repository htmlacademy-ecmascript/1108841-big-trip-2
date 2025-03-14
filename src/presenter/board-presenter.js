import BoardView from '../view/board-view.js';
import SortView from '../view/sort-view.js';
import EmptyListView from '../view/empty-list-view.js';
import LoadingView from '../view/loading-view.js';
import ErrorView from '../view/error-view.js';
import PointPresenter from './point-presenter.js';
import NewPointPresenter from './new-point-presenter.js';
import { render, remove } from '../utils/render-utils.js';
import { isPointFuture, isPointPresent, isPointPast } from '../utils/filter.js';
import { SortType, SortTypeEnabled, UserAction, UpdateType, FilterType, DEFAULT_POINT } from '../const.js';
import dayjs from 'dayjs';
import UiBlocker from '../framework/ui-blocker/ui-blocker.js';

const TimeLimit = {
  LOWER_LIMIT: 350,
  UPPER_LIMIT: 1000,
};

export default class BoardPresenter {
  #boardComponent = null;
  #container = null;
  #destinationsModel = null;
  #offersModel = null;
  #tripsModel = null;
  #filterModel = null;
  #sortModel = null;
  #pointPresenters = new Map();
  #newPointPresenter = null;
  #emptyComponent = null;
  #sortComponent = null;
  #loadingComponent = null;
  #errorComponent = null;
  #isLoading = true;
  #currentSortType = null;
  #canCreatePoint = true;
  #isCreating = false;
  #uiBlocker = null;

  constructor({ container, destinationsModel, offersModel, tripsModel, filterModel, sortModel }) {
    this.#container = container;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
    this.#tripsModel = tripsModel;
    this.#filterModel = filterModel;
    this.#sortModel = sortModel;
    this.#currentSortType = this.#sortModel.sortType;
    this.#uiBlocker = new UiBlocker({
      lowerLimit: TimeLimit.LOWER_LIMIT,
      upperLimit: TimeLimit.UPPER_LIMIT
    });

    this.#newPointPresenter = new NewPointPresenter({
      destinationsModel: this.#destinationsModel,
      offersModel: this.#offersModel,
      onDataChange: this.#handleViewAction,
      onDestroy: this.#handleNewPointFormClose
    });

    this.#destinationsModel.addObserver(this.#handleModelEvent);
    this.#offersModel.addObserver(this.#handleModelEvent);
    this.#tripsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
    this.#sortModel.addObserver(this.#handleModelEvent);
  }

  #handleModelEvent = (updateType, data) => {
    const updateHandlers = {
      [UpdateType.PATCH]: () => {
        if (data && data.id) {
          this.#pointPresenters.get(data.id)?.init(data);
        }
      },
      [UpdateType.MINOR]: () => this.#refreshBoard(),
      [UpdateType.MAJOR]: () => this.#refreshBoard(),
      [UpdateType.INIT]: () => {
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.init();
      },
      [UpdateType.ERROR]: () => {
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.#renderError();
      }
    };

    const handler = updateHandlers[updateType];
    if (handler) {
      handler();
    } else {
      throw new Error(`Unknown Update Type: ${updateType}`);
    }
  };

  #refreshBoard() {
    this.#clearBoard();
    this.#renderBoard(this.getPoints());
  }

  #handleModeChange = () => {
    this.#newPointPresenter.destroy();
    this.#pointPresenters.forEach((presenter) => presenter.resetView());
  };

  #handleViewAction = async (actionType, updateType, update) => {
    this.#uiBlocker.block();
    let pointPresenter = null;
    const isFavoriteUpdate = update && this.#tripsModel.trips.some((trip) =>
      trip.id === update.id &&
      trip.isFavorite !== update.isFavorite &&
      Object.keys(update).length === Object.keys(trip).length
    );

    try {
      switch (actionType) {
        case UserAction.UPDATE_POINT:
          pointPresenter = this.#pointPresenters.get(update.id);

          if (isFavoriteUpdate) {
            if (pointPresenter) {
              pointPresenter.setDisabled();
            }
            await this.#tripsModel.updatePoint(updateType, update);
            if (pointPresenter) {
              pointPresenter.setEnabled();
            }
          } else {
            if (pointPresenter) {
              pointPresenter.setSaving();
            }
            await this.#tripsModel.updatePoint(updateType, update);
          }
          break;
        case UserAction.ADD_POINT:
          this.#newPointPresenter.setSaving();
          await this.#tripsModel.addPoint(updateType, update);
          this.#newPointPresenter.destroy();
          this.#isCreating = false;
          break;
        case UserAction.DELETE_POINT:
          pointPresenter = this.#pointPresenters.get(update.id);
          if (pointPresenter) {
            pointPresenter.setDeleting();
          }
          await this.#tripsModel.deletePoint(updateType, update);
          this.#checkEmptyList();
          break;
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }
    } catch (err) {
      console.error(err);
      switch (actionType) {
        case UserAction.UPDATE_POINT:
          if (pointPresenter) {
            pointPresenter.setAborting();
          }
          break;
        case UserAction.ADD_POINT:
          this.#newPointPresenter.setAborting();
          break;
        case UserAction.DELETE_POINT:
          if (pointPresenter) {
            pointPresenter.setDeletingFailed();
          }
          break;
      }
    } finally {
      this.#uiBlocker.unblock();
    }
  };

  #checkEmptyList() {
    const currentFilterType = this.#filterModel.filterType;
    const filteredPoints = this.#filterPoints(this.#tripsModel.trips, currentFilterType);
    if (filteredPoints.length === 0) {
      this.#clearBoard();
      this.#renderSort();
      this.#ensureBoardExists();
      this.#renderEmptyList();
    }
  }

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

  #filterPoints(trips, filterType) {
    if (!trips || !trips.length) {
      return [];
    }

    const validPoints = trips.filter((point) =>
      point && point.dateFrom && point.dateTo
    );

    const filterHandlers = {
      [FilterType.EVERYTHING]: () => validPoints,
      [FilterType.FUTURE]: () => validPoints.filter(isPointFuture),
      [FilterType.PRESENT]: () => validPoints.filter(isPointPresent),
      [FilterType.PAST]: () => validPoints.filter(isPointPast)
    };

    return (filterHandlers[filterType] || filterHandlers[FilterType.EVERYTHING])();
  }

  #calculateEventDuration(point) {
    if (!point || !point.dateFrom || !point.dateTo) {
      return 0;
    }
    return dayjs(point.dateTo).diff(dayjs(point.dateFrom));
  }

  #sortPoints(points, sortType) {
    if (!points || !points.length) {
      return [];
    }

    const validPoints = points.filter((point) =>
      point && point.dateFrom && point.dateTo
    );

    const sortHandlers = {
      [SortType.DAY]: () => validPoints.sort((pointA, pointB) =>
        dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom))
      ),
      [SortType.TIME]: () => validPoints.sort((pointA, pointB) => {
        const durationA = this.#calculateEventDuration(pointA);
        const durationB = this.#calculateEventDuration(pointB);
        return durationB - durationA || dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom));
      }),
      [SortType.PRICE]: () => validPoints.sort((pointA, pointB) =>
        pointB.basePrice - pointA.basePrice
      )
    };

    return (sortHandlers[sortType] || sortHandlers[SortType.DAY])();
  }

  #renderEmptyList() {
    if (this.#emptyComponent) {
      remove(this.#emptyComponent);
    }

    this.#emptyComponent = new EmptyListView({
      filterType: this.#filterModel.filterType,
      isCreatingNewPoint: this.#isCreating
    });

    if (this.#boardComponent) {
      render(this.#emptyComponent, this.#boardComponent.element);
    }
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
    if (this.#sortComponent) {
      remove(this.#sortComponent);
    }

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
    this.#ensureBoardExists();

    if (!points || points.length === 0) {
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
    this.#clearComponents();
  }

  #clearComponents() {
    [
      this.#sortComponent,
      this.#emptyComponent,
      this.#boardComponent,
      this.#loadingComponent,
      this.#errorComponent
    ].forEach((component) => {
      if (component) {
        remove(component);
      }
    });

    this.#sortComponent = null;
    this.#emptyComponent = null;
    this.#boardComponent = null;
    this.#loadingComponent = null;
    this.#errorComponent = null;
  }

  #handleNewPointFormClose = () => {
    this.#isCreating = false;

    // Разблокируем кнопку создания новой точки
    const newPointButtonElement = document.querySelector('.trip-main__event-add-btn');
    if (newPointButtonElement) {
      newPointButtonElement.disabled = false;
    }

    // Если список пуст, показываем стандартное сообщение о пустом списке
    if (this.#tripsModel.trips.length === 0) {
      this.#renderEmptyList();
    }
  };

  resetSortType(silentUpdate = false) {
    this.#sortModel.setSortType(SortType.DAY, silentUpdate);
    this.#currentSortType = SortType.DAY;
    if (!silentUpdate) {
      const sortInput = document.querySelector(`#sort-${SortType.DAY}`);
      if (sortInput) {
        sortInput.checked = true;
      }
      document.querySelectorAll(`input[name="trip-sort"]:not(#sort-${SortType.DAY})`).forEach((input) => {
        input.checked = false;
      });
      this.#clearPointsList();
      this.#renderPoints(this.getPoints());
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

  init() {
    this.#clearBoard();

    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    if (this.#hasInitError()) {
      this.#renderError();
      return;
    }

    const points = this.getPoints();
    this.#renderBoard(points);

    if (this.#isCreating && this.#canCreatePoint) {
      this.createPoint();
    }
  }

  #hasInitError() {
    return this.#destinationsModel.destinations.length === 0 ||
           this.#offersModel.offers.length === 0 ||
           this.#tripsModel.hasError;
  }

  setIsLoading(isLoading) {
    this.#isLoading = isLoading;
  }

  isCreating() {
    return this.#isCreating;
  }

  createPoint() {
    // Если уже создается точка, не создаем новую
    if (this.#isCreating) {
      return;
    }

    // Подготовка к созданию новой точки
    this.#prepareForNewPoint();

    // Закрытие всех открытых форм редактирования
    this.#pointPresenters.forEach((presenter) => {
      presenter.resetView();
    });

    // Очистка и перерисовка доски
    this.#clearBoard();
    this.#renderSort();
    this.#renderPointsOrEmpty();

    // Убедимся, что доска существует
    this.#ensureBoardExists();

    // Устанавливаем флаг создания и инициализируем презентер новой точки
    this.#isCreating = true;

    // Устанавливаем контейнер для NewPointPresenter
    this.#newPointPresenter.setContainer(this.#boardComponent.element);
    this.#newPointPresenter.init();
  }

  #prepareForNewPoint() {
    // Установка фильтра и сортировки
    this.#filterModel.setFilterType(FilterType.EVERYTHING, true);
    this.#sortModel.setSortType(SortType.DAY, true);
    this.#currentSortType = SortType.DAY;

    // Обновление UI фильтров и сортировки
    const filterInput = document.querySelector(`#filter-${FilterType.EVERYTHING}`);
    if (filterInput) {
      filterInput.checked = true;
    }
    const sortInput = document.querySelector(`#sort-${SortType.DAY}`);
    if (sortInput) {
      sortInput.checked = true;
    }
  }

  #renderPointsOrEmpty() {
    const points = this.getPoints();

    // Удаление сообщения о пустом списке, если оно есть
    if (this.#emptyComponent) {
      remove(this.#emptyComponent);
      this.#emptyComponent = null;
    }

    if (points.length > 0) {
      this.#renderBoard(points);
    } else if (this.#tripsModel.trips.length === 0) {
      this.#emptyComponent = new EmptyListView({
        filterType: this.#filterModel.filterType,
        isCreatingNewPoint: true
      });
      if (this.#boardComponent && this.#boardComponent.element) {
        render(this.#emptyComponent, this.#boardComponent.element);
      }
    }
  }
}
