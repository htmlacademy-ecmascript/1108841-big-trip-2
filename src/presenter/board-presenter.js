import BoardView from '../view/board-view.js';
import SortView from '../view/sort-view.js';
import EmptyListView from '../view/empty-list-view.js';
import LoadingView from '../view/loading-view.js';
import ErrorView from '../view/error-view.js';
import PointPresenter from './point-presenter.js';
import PointEditView from '../view/point-edit-view.js';
import { render, remove } from '../utils/render-utils.js';
import { isPointFuture, isPointPresent, isPointPast } from '../utils/filter.js';
import { SortType, SortTypeEnabled, UserAction, UpdateType, FilterType, IdConfig, DEFAULT_POINT, EmptyListTexts } from '../const.js';
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
  #emptyComponent = null;
  #sortComponent = null;
  #loadingComponent = null;
  #errorComponent = null;
  #isLoading = true;
  #currentSortType = null;
  #canCreatePoint = true;
  #isCreating = false;
  #newPointComponent = null;
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

    this.#destinationsModel.addObserver(this.#handleModelEvent);
    this.#offersModel.addObserver(this.#handleModelEvent);
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
        this.#clearBoard();
        this.#renderBoard(this.getPoints());
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.init();
        break;
      case UpdateType.ERROR:
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.#renderError();
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

  #handleViewAction = async (actionType, updateType, update) => {
    this.#uiBlocker.block();

    switch (actionType) {
      case UserAction.UPDATE_POINT:
        const isFavoriteUpdate = update && this.#tripsModel.trips.some(trip =>
          trip.id === update.id &&
          trip.isFavorite !== update.isFavorite &&
          Object.keys(update).length === Object.keys(trip).length
        );

        if (isFavoriteUpdate) {
          const pointPresenter = this.#pointPresenters.get(update.id);
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
              pointPresenter.setFavoriteAborting();
            }
          }
        } else {
          const pointPresenter = this.#pointPresenters.get(update.id);
          if (pointPresenter) {
            pointPresenter.setSaving();
          }

          try {
            await this.#tripsModel.updatePoint(updateType, update);
          } catch(err) {
            if (pointPresenter) {
              pointPresenter.setAborting();
            }
          }
        }
        break;
      case UserAction.ADD_POINT:
        if (this.#newPointComponent) {
          this.#newPointComponent.setSaving();
        }

        try {
          await this.#tripsModel.addPoint(updateType, update);
          this.#handleNewPointFormClose();
        } catch(err) {
          if (this.#newPointComponent) {
            this.#newPointComponent.setAborting();
          }
        }
        break;
      case UserAction.DELETE_POINT:
        const pointPresenter = this.#pointPresenters.get(update.id);
        if (pointPresenter) {
          pointPresenter.setDeleting();
        }

        try {
          await this.#tripsModel.deletePoint(updateType, update);
        } catch(err) {
          if (pointPresenter) {
            pointPresenter.setAborting();
          }
        }
        break;
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }

    this.#uiBlocker.unblock();
  };

  #handleModeChange = (pointId) => {
    if (this.#newPointComponent) {
      this.#handleNewPointFormClose();
    }

    this.#filterModel.setFilterType(FilterType.EVERYTHING, true);

    // Если pointId не передан, закрываем все открытые формы
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
    // Проверяем и отфильтровываем невалидные точки
    const validPoints = trips.filter((point) =>
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
    // Удаляем старый компонент, если он есть
    if (this.#emptyComponent) {
      remove(this.#emptyComponent);
      this.#emptyComponent = null;
    }

    // Создаем новый компонент с правильным типом фильтра
    this.#emptyComponent = new EmptyListView({
      filterType: this.#filterModel.filterType,
      isCreatingNewPoint: this.#isCreating
    });

    // Рендерим компонент на доске
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
    // Рендерим сортировку сначала
    this.#renderSort();

    // Затем создаем и рендерим доску, если нужно
    const isNewBoard = this.#ensureBoardExists();
    if (!isNewBoard) {
      render(this.#boardComponent, this.#container);
    }

    // Проверяем наличие точек
    if (!points || points.length === 0) {
      // Если точек нет, показываем сообщение
      this.#renderEmptyList();
      return;
    }

    // Если точки есть, рендерим их
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
    // Сбрасываем фильтр и сортировку
    this.#filterModel.setFilterType(FilterType.EVERYTHING, true);
    this.#sortModel.setSortType(SortType.DAY, true);
    this.#currentSortType = SortType.DAY;

    // Программно обновляем состояние фильтра и сортировки в DOM
    const filterInput = document.querySelector(`#filter-${FilterType.EVERYTHING}`);
    if (filterInput) {
      filterInput.checked = true;
    }

    const sortInput = document.querySelector(`#sort-${SortType.DAY}`);
    if (sortInput) {
      sortInput.checked = true;
    }

    // Снимаем выделение с других сортировок
    document.querySelectorAll('input[name="trip-sort"]:not(#sort-day)').forEach((input) => {
      input.checked = false;
    });

    // Полностью очищаем и перерисовываем доску
    this.#clearBoard();

    const points = this.getPoints();

    // Отображаем только сортировку, но не сообщение о пустом списке
    this.#renderSort();

    if (points.length > 0) {
      this.#renderBoard(points);
    }

    this.#handleModeChange();
    this.#ensureBoardExists();
  }

  #rerenderPointsIfNeeded() {
    const hasNonEditingItems = this.#boardComponent && this.#boardComponent.hasNonEditingItems();

    const shouldRerenderPoints =
      this.#pointPresenters.size > 0 && hasNonEditingItems;

    if (shouldRerenderPoints) {
      const points = this.getPoints();
      this.#clearPointsList();
      this.#renderPoints(points);
    }
  }

  #createNewPointComponent() {
    this.#newPointComponent = new PointEditView({
      point: {...DEFAULT_POINT},
      destinations: this.#destinationsModel.destinations,
      offers: this.#offersModel.offers,
      onSubmit: this.#handleViewAction.bind(this, UserAction.ADD_POINT, UpdateType.MINOR),
      onRollupClick: this.#handleNewPointFormClose,
      onDeleteClick: this.#handleNewPointFormClose
    });
  }

  #renderNewPointForm() {
    if (!this.#boardComponent || !this.#boardComponent.element) {
      return;
    }

    const boardElement = this.#boardComponent.element;
    render(this.#newPointComponent, boardElement, 'afterbegin');
    this.#newPointComponent.setEventListeners();
    document.addEventListener('keydown', this.#onEscKeyDownForNewPoint);
  }

  createPoint() {
    this.#prepareForNewPoint();
    this.#rerenderPointsIfNeeded();

    // Удаляем сообщение о пустом списке, если оно есть
    if (this.#emptyComponent) {
      remove(this.#emptyComponent);
      this.#emptyComponent = null;
    }

    if (this.#newPointComponent !== null) {
      return;
    }

    this.#isCreating = true;

    // Убедимся, что доска существует перед созданием формы
    this.#ensureBoardExists();

    // Если в приложении нет точек, создаем EmptyListView с флагом isCreatingNewPoint=true
    if (this.#tripsModel.trips.length === 0) {
      // Удаляем старый компонент, если он есть
      if (this.#emptyComponent) {
        remove(this.#emptyComponent);
        this.#emptyComponent = null;
      }

      this.#emptyComponent = new EmptyListView({
        filterType: this.#filterModel.filterType,
        isCreatingNewPoint: true
      });

      if (this.#boardComponent && this.#boardComponent.element) {
        render(this.#emptyComponent, this.#boardComponent.element);
      }
    }

    this.#createNewPointComponent();

    // Проверим, существует ли доска перед рендерингом формы
    if (this.#boardComponent && this.#boardComponent.element) {
      this.#renderNewPointForm();
    } else {
      this.#isCreating = false;
    }
  }

  #handleNewPointFormClose = () => {
    if (!this.#newPointComponent) {
      return;
    }

    this.#newPointComponent.reset(this.#offersModel.offers, this.#destinationsModel.destinations);
    this.#newPointComponent.element.querySelector('.event__input--destination').focus();
    document.removeEventListener('keydown', this.#onEscKeyDownForNewPoint);
    this.#newPointComponent.element.remove();
    this.#newPointComponent = null;

    // Сбрасываем флаг создания
    this.#isCreating = false;

    // Проверяем, есть ли точки
    const points = this.getPoints();
    if (points.length === 0) {
      // Если точек нет, показываем сообщение о пустом списке
      this.#renderEmptyList();
    }
  };

  #onEscKeyDownForNewPoint = (evt) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      this.#handleNewPointFormClose();

      // Сбрасываем флаг создания
      this.#isCreating = false;

      // Если точек нет, показываем сообщение о пустом списке
      const points = this.getPoints();
      if (points.length === 0) {
        this.#renderEmptyList();
      }
    }
  };

  resetSortType(silentUpdate = false) {
    this.#sortModel.setSortType(SortType.DAY, silentUpdate);
    this.#currentSortType = SortType.DAY;

    // Если не тихое обновление, то обновляем DOM
    if (!silentUpdate) {
      // Программно обновляем состояние сортировки в DOM
      const sortInput = document.querySelector(`#sort-${SortType.DAY}`);
      if (sortInput) {
        sortInput.checked = true;
      }

      // Снимаем выделение с других сортировок
      document.querySelectorAll(`input[name="trip-sort"]:not(#sort-${SortType.DAY})`).forEach((input) => {
        input.checked = false;
      });

      // Обновляем список точек
      this.#clearPointsList();
      this.#renderPoints(this.getPoints());
    }
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
    // Очищаем доску полностью
    this.#clearBoard();

    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    // Проверяем наличие данных о направлениях и предложениях
    if (this.#destinationsModel.destinations.length === 0 || this.#offersModel.offers.length === 0) {
      this.#renderError();
      return;
    }

    // Если у нас есть ошибка загрузки точек, показываем сообщение об ошибке
    if (this.#tripsModel.hasError) {
      this.#renderError();
      return;
    }

    // Получаем отфильтрованные точки
    const points = this.getPoints();

    // Рендерим доску (сортировка + точки или сообщение)
    this.#renderBoard(points);

    // Инициализируем форму создания точки, если нужно
    this.#initNewPointForm();
  }

  setIsLoading(isLoading) {
    this.#isLoading = isLoading;
  }

  isCreating() {
    return this.#isCreating;
  }
}
