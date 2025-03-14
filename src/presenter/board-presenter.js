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
  #updateCurrentFilterType = null;

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
        this.#pointPresenters.get(data.id)?.init(data);
      },
      [UpdateType.MINOR]: () => {
        this.#clearBoard();
        this.#renderBoard(this.getPoints());
      },
      [UpdateType.MAJOR]: () => {
        this.#clearBoard();
        this.#renderBoard(this.getPoints());
      },
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

  #setAbortingForPresenter(pointId) {
    const pointPresenter = this.#pointPresenters.get(pointId);
    if (pointPresenter) {
      pointPresenter.setAborting();
    }
  }

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
          if (isFavoriteUpdate) {
            pointPresenter = this.#pointPresenters.get(update.id);
            if (pointPresenter) {
              pointPresenter.setDisabled();
            }
            try {
              await this.#tripsModel.updatePoint(updateType, update);
              if (pointPresenter) {
                pointPresenter.setEnabled();
              }
            } catch(err) {
              if (pointPresenter) {
                pointPresenter.setAborting();
              }
            }
          } else {
            this.#pointPresenters.get(update.id).setSaving();
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
          const currentFilterType = this.#filterModel.filterType;
          const filteredPoints = this.#filterPoints(this.#tripsModel.trips, currentFilterType);
          if (filteredPoints.length === 0) {
            this.#clearBoard();
            this.#renderSort();
            this.#ensureBoardExists();
            this.#renderEmptyList();
          }
          break;
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }
    } catch (err) {
      console.error(err);
      switch (actionType) {
        case UserAction.UPDATE_POINT:
          if (!isFavoriteUpdate && this.#pointPresenters.get(update.id)) {
            this.#pointPresenters.get(update.id).setAborting();
          }
          break;
        case UserAction.ADD_POINT:
          this.#newPointPresenter.setAborting();
          break;
        case UserAction.DELETE_POINT:
          if (pointPresenter) {
            pointPresenter.setAborting();
          }
          break;
      }
    } finally {
      this.#uiBlocker.unblock();
    }
  };

  #handleModeChange = (pointId) => {
    // Закрываем форму создания новой точки, если она открыта
    if (this.#isCreating) {
      this.#newPointPresenter.destroy();
      this.#isCreating = false;
    }

    if (pointId && this.#pointPresenters.get(pointId)?.isEditing()) {
      this.#filterModel.setFilterType(FilterType.EVERYTHING, true);
    }
    if (!pointId) {
      this.#pointPresenters.forEach((presenter) => {
        presenter.resetView();
      });
      return;
    }
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

  #filterPoints(trips, filterType) {
    const validPoints = trips.filter((point) =>
      point && point.dateFrom && point.dateTo
    );

    const filterHandlers = {
      [FilterType.EVERYTHING]: () => validPoints,
      [FilterType.FUTURE]: () => validPoints.filter((point) => isPointFuture(point)),
      [FilterType.PRESENT]: () => validPoints.filter((point) => isPointPresent(point)),
      [FilterType.PAST]: () => validPoints.filter((point) => isPointPast(point))
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
        if (durationA === durationB) {
          return dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom));
        }
        return durationB - durationA;
      }),
      [SortType.PRICE]: () => validPoints.sort((pointA, pointB) =>
        pointB.basePrice - pointA.basePrice
      )
    };

    return (sortHandlers[sortType] || (() => validPoints))();
  }

  #renderEmptyList() {
    if (this.#emptyComponent) {
      remove(this.#emptyComponent);
      this.#emptyComponent = null;
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

  #handleNewPointFormClose = () => {
    this.#isCreating = false;

    // Если список пуст, показываем стандартное сообщение о пустом списке
    if (this.#tripsModel.trips.length === 0) {
      if (this.#emptyComponent) {
        remove(this.#emptyComponent);
      }
      this.#emptyComponent = new EmptyListView({
        filterType: this.#filterModel.filterType,
        isCreatingNewPoint: false
      });
      if (this.#boardComponent && this.#boardComponent.element) {
        render(this.#emptyComponent, this.#boardComponent.element);
      }
    }

    // Разблокируем кнопку создания новой точки
    const newPointButtonElement = document.querySelector('.trip-main__event-add-btn');
    if (newPointButtonElement) {
      newPointButtonElement.disabled = false;
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
    if (this.#destinationsModel.destinations.length === 0 || this.#offersModel.offers.length === 0) {
      this.#renderError();
      return;
    }
    if (this.#tripsModel.hasError) {
      this.#renderError();
      return;
    }
    const points = this.getPoints();
    this.#renderBoard(points);
    this.#initNewPointForm();
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

    // Закрытие всех открытых форм редактирования
    this.#pointPresenters.forEach((presenter) => {
      presenter.resetView();
    });

    // Очистка и перерисовка доски
    this.#clearBoard();
    const points = this.getPoints();
    this.#renderSort();
    if (points.length > 0) {
      this.#renderBoard(points);
    }

    // Удаление сообщения о пустом списке, если оно есть
    if (this.#emptyComponent) {
      remove(this.#emptyComponent);
      this.#emptyComponent = null;
    }

    // Если список пуст, показываем специальное сообщение
    if (this.#tripsModel.trips.length === 0) {
      this.#emptyComponent = new EmptyListView({
        filterType: this.#filterModel.filterType,
        isCreatingNewPoint: true
      });
      if (this.#boardComponent && this.#boardComponent.element) {
        render(this.#emptyComponent, this.#boardComponent.element);
      }
    }

    // Убедимся, что доска существует
    this.#ensureBoardExists();

    // Устанавливаем флаг создания и инициализируем презентер новой точки
    this.#isCreating = true;

    // Устанавливаем контейнер для NewPointPresenter
    this.#newPointPresenter.setContainer(this.#boardComponent.element);
    this.#newPointPresenter.init();
  }
}
