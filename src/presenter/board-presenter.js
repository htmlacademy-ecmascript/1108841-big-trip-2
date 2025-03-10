import BoardView from '../view/board-view.js';
import SortView from '../view/sort-view.js';
import EmptyListView from '../view/empty-list-view.js';
import LoadingView from '../view/loading-view.js';
import ErrorView from '../view/error-view.js';
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
        // Обновляем только конкретную точку
        this.#pointPresenters.get(data.id)?.init(data);
        break;
      case UpdateType.MINOR:
        // Обновляем список точек
        this.init();
        break;
      case UpdateType.MAJOR:
        // Полное обновление экрана
        this.init();
        break;
      case UpdateType.FORCE:
        // Принудительная перерисовка без обновления всей доски
        {
          // Получаем все точки напрямую из модели без фильтрации
          const allPoints = this.#tripsModel.trips;

          // Очищаем список точек
          this.#clearPointsList();

          // Отрисовываем все точки из модели без фильтрации
          allPoints.forEach((point) => this.#renderPoint(point));
        }
        break;
    }
  };

  #handleViewAction = async (actionType, updateType, update) => {
    // Если это просто закрытие формы без изменений, обновляем только список
    if (actionType === UserAction.UPDATE_POINT && updateType === UpdateType.MINOR &&
        !document.querySelector('.event--edit')) {
      // Перерисовываем список и обновляем презентер конкретной точки
      this.#clearPointsList();
      this.#renderPoints(this.points);
      return;
    }

    // Если это просто закрытие формы без изменений с принудительным обновлением, ничего не делаем
    if (actionType === UserAction.UPDATE_POINT && updateType === UpdateType.FORCE) {
      return;
    }

    try {
      switch (actionType) {
        case UserAction.UPDATE_POINT: {
          // Найдем презентер точки, которую обновляем
          const pointPresenter = this.#pointPresenters.get(update.id);
          if (pointPresenter) {
            try {
              // Покажем сообщение о загрузке в форме, только если форма есть
              pointPresenter.setSaving();
            } catch (error) {
              // Если форма уже закрыта, просто продолжаем с обновлением
              // eslint-disable-next-line no-console
              console.log('Форма уже закрыта, продолжаем с обновлением');
            }
          }
          await this.#tripsModel.updateTrip(updateType, update);
          break;
        }
        case UserAction.ADD_POINT: {
          // Покажем состояние загрузки при добавлении
          if (this.#newPointComponent) {
            this.#newPointComponent.updateElement({ isSaving: true });
          }
          await this.#tripsModel.addTrip(updateType, update);
          this.#handleNewPointFormClose();
          break;
        }
        case UserAction.DELETE_POINT: {
          // Найдем презентер точки, которую удаляем
          const deletePresenter = this.#pointPresenters.get(update.id);
          if (deletePresenter) {
            // Покажем состояние удаления
            deletePresenter.setDeleting();
          }
          await this.#tripsModel.deleteTrip(updateType, update.id);
          break;
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Ошибка при выполнении действия:', err);

      // Обработка ошибок в зависимости от типа действия
      switch (actionType) {
        case UserAction.UPDATE_POINT: {
          // Вернем форму в нормальное состояние и покажем ошибку
          const pointPresenter = this.#pointPresenters.get(update.id);
          if (pointPresenter) {
            pointPresenter.setAborting();
          }
          break;
        }
        case UserAction.ADD_POINT: {
          // Вернем форму создания в нормальное состояние
          if (this.#newPointComponent) {
            this.#newPointComponent.updateElement({
              isSaving: false,
              isDisabled: false,
              isError: true,
              errorMessage: 'Не удалось создать точку маршрута'
            });
            // Добавляем эффект "покачивания головой"
            this.#newPointComponent.shake();
          }
          break;
        }
        case UserAction.DELETE_POINT: {
          // Вернем форму удаления в нормальное состояние
          const deletePresenter = this.#pointPresenters.get(update.id);
          if (deletePresenter) {
            deletePresenter.setAborting();
          }
          break;
        }
      }
    }
  };

  #handleModeChange = (pointId) => {
    // Закрываем форму создания новой точки, если она открыта
    if (this.#newPointComponent) {
      this.#handleNewPointFormClose();
    }

    // Сбрасываем фильтр на "EVERYTHING" чтобы все точки были видны
    this.#filterModel.setFilterType(FilterType.EVERYTHING);

    // Закрываем все формы, кроме текущей
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
    // Если есть открытая форма редактирования, возвращаем все точки без фильтрации
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
    // Сначала рендерим сортировку
    this.#renderSort();

    // Затем рендерим доску
    if (!this.#boardComponent) {
      this.#boardComponent = new BoardView();
    }
    render(this.#boardComponent, this.#container);

    if (points.length === 0) {
      this.#renderEmptyList();
      return;
    }

    // Просто рендерим точки
    this.#renderPoints(points);
  }

  #clearPointsList() {
    // Просто удаляем все презентеры
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

    // Проверка, отображаются ли точки
    const points = this.points;
    if (points.length > 0 && this.#pointPresenters.size === 0) {
      // Если точки есть, но не отображаются, отображаем их
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

    const points = this.points;

    // Проверка, есть ли данные для отображения
    if (points.length === 0 && !this.#isCreating) {
      // Если точек нет и не создается новая, показываем пустой список
      this.#renderEmptyList();
      return;
    }

    // Отрисовываем доску с точками
    this.#renderBoard(points);

    // Проверяем, все ли точки отрисованы
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
