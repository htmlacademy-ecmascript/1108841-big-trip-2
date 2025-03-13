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

    this.#destinationsModel.addObserver(this.#handleModelEvent);
    this.#offersModel.addObserver(this.#handleModelEvent);
    this.#tripsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
    this.#sortModel.addObserver(this.#handleModelEvent);
  }

  #handleModelEvent = (updateType, data) => {
    console.log('Model event:', updateType, data ? data.id : 'no data');

    switch (updateType) {
      case UpdateType.PATCH:
        this.#pointPresenters.get(data.id)?.init(data);
        break;
      case UpdateType.MINOR:
      case UpdateType.MAJOR:
        // Полностью очищаем доску для перерисовки
        this.#clearBoard();

        // Получаем отфильтрованные точки
        const points = this.getPoints();

        // Рендерим сортировку
        this.#renderSort();

        // Проверяем наличие точек после фильтрации
        if (points.length === 0) {
          // Если точек нет, показываем сообщение
          console.log('Нет точек, отображаем сообщение для фильтра:', this.#filterModel.filterType);
          // Убедимся, что доска существует
          this.#ensureBoardExists();
          this.#renderEmptyList();
        } else {
          // Если точки есть, рендерим доску
          this.#ensureBoardExists();
          this.#renderPoints(points);
        }
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

  #handlePointUpdate(update) {
    // Блокируем все контролы на время запроса
    this.#blockAllControls();

    const pointPresenter = this.#pointPresenters.get(update.id);
    if (pointPresenter) {
      pointPresenter.setSaving();
    }

    this.#updateCurrentFilterType = this.#filterModel.filterType;

    this.#tripsModel.updatePoint(UpdateType.MINOR, update)
      .then(() => {
        // Разблокируем все контролы после успешного запроса
        this.#unblockAllControls();
      })
      .catch((err) => {
        // В случае ошибки также разблокируем контролы
        pointPresenter?.setAborting();
        this.#unblockAllControls();
        console.error('Error updating point:', err);
      });
  }

  #handlePointAdd(update) {
    // Блокируем все контролы на время запроса
    this.#blockAllControls();

    // Явно устанавливаем состояние формы создания точки
    if (this.#newPointComponent) {
      this.#newPointComponent.setSaving();
    }

    this.#updateCurrentFilterType = this.#filterModel.filterType;

    this.#tripsModel.addPoint(UpdateType.MINOR, update)
      .then(() => {
        // Разблокируем контролы
        this.#unblockAllControls();
        this.#handleNewPointFormClose();
      })
      .catch((err) => {
        // При ошибке добавления новой точки применяем анимацию shake
        if (this.#newPointComponent) {
          this.#newPointComponent.setAborting();
        } else {
          // Запасной вариант для DOM-элемента если компонент недоступен
          const newPointPresenterInstance = document.querySelector('.event--edit');
          if (newPointPresenterInstance) {
            newPointPresenterInstance.classList.add('shake');
            setTimeout(() => {
              newPointPresenterInstance.classList.remove('shake');
            }, 600);
          }
        }

        // В случае ошибки также разблокируем контролы
        this.#unblockAllControls();
        console.error('Error adding point:', err);
      });
  }

  #handlePointDelete(update) {
    // Блокируем все контролы на время запроса
    this.#blockAllControls();

    const pointPresenter = this.#pointPresenters.get(update.id);
    if (pointPresenter) {
      pointPresenter.setDeleting();
    }

    this.#updateCurrentFilterType = this.#filterModel.filterType;

    const totalPoints = this.getPoints().length;
    const filteredPoints = this.#filterPoints(this.getPoints()).length;

    console.log(`Удаление точки. Фильтр: ${this.#filterModel.filterType}. Всего точек: ${totalPoints}, отфильтрованных: ${filteredPoints}`);

    this.#tripsModel.deletePoint(UpdateType.MINOR, update)
      .then(() => {
        // После удаления проверяем, остались ли точки для текущего фильтра
        const remainingFilteredPoints = this.#filterPoints(this.getPoints()).length;
        console.log(`После удаления точки. Фильтр: ${this.#filterModel.filterType}. Отфильтрованных точек: ${remainingFilteredPoints}`);

        // Разблокируем контролы
        this.#unblockAllControls();
      })
      .catch((err) => {
        pointPresenter?.setDeletingFailed();
        // В случае ошибки также разблокируем контролы
        this.#unblockAllControls();
        console.error('Error deleting point:', err);
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
    console.log('Рендерим пустой список для фильтра:', this.#filterModel.filterType);

    // Удаляем все существующие сообщения из DOM
    const existingMsg = document.querySelector('.trip-events__msg');
    if (existingMsg) {
      existingMsg.remove();
    }

    // Убедимся, что есть контейнер для отображения сообщения
    this.#ensureBoardExists();

    // Определяем текущий тип фильтра
    const filterType = this.#filterModel.filterType;

    // Создаем новый компонент с правильным типом фильтра
    this.#emptyComponent = new EmptyListView(filterType);

    // Рендерим компонент на доске
    if (this.#boardComponent) {
      render(this.#emptyComponent, this.#boardComponent.element);
      console.log('Пустой список отрендерен с сообщением:',
        this.#emptyComponent.element.textContent);
    } else {
      console.error('Доска не существует для рендеринга пустого списка');
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
    if (points.length === 0) {
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

    // Проверяем наличие сообщения и удаляем его, если фильтр не PRESENT
    if (this.#filterModel.filterType !== FilterType.PRESENT) {
      const tripEventsMsg = document.querySelector('.trip-events__msg');
      if (tripEventsMsg) {
        tripEventsMsg.remove();
      }
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

    // Также удаляем сообщение из DOM напрямую
    const tripEventsMsg = document.querySelector('.trip-events__msg');
    if (tripEventsMsg) {
      tripEventsMsg.remove();
    }

    if (this.#newPointComponent !== null) {
      return;
    }

    this.#isCreating = true;

    // Если в приложении нет точек, создаем EmptyListView с флагом isCreatingNewPoint=true
    if (this.#tripsModel.trips.length === 0) {
      this.#emptyComponent = new EmptyListView({
        filterType: this.#filterModel.filterType,
        isCreatingNewPoint: true
      });
      render(this.#emptyComponent, this.#container);
    }

    this.#createNewPointComponent();
    this.#renderNewPointForm();
  }

  #handleNewPointFormClose = () => {
    if (!this.#newPointComponent) {
      return;
    }

    remove(this.#newPointComponent);
    this.#newPointComponent = null;
    const wasCreating = this.#isCreating;
    this.#isCreating = false;

    document.removeEventListener('keydown', this.#onEscKeyDownForNewPoint);

    const points = this.getPoints();

    // Отображаем точки, если они есть
    if (points.length > 0) {
      if (this.#pointPresenters.size === 0) {
        this.#renderPoints(points);
      }
    }
    // Отображаем сообщение о пустом списке, но только если это было отменой создания
    // и нет других точек (т.е. пользователь отменил создание первой точки)
    else if (wasCreating && points.length === 0) {
      this.#renderEmptyList();
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

    // Получаем отфильтрованные точки
    const points = this.getPoints();

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

  #blockAllControls() {
    // Блокируем все кнопки edit у точек
    this.#pointPresenters.forEach((presenter) => {
      presenter.setDisabled();
    });

    // Блокируем кнопку добавления новой точки
    const newPointButton = document.querySelector('.trip-main__event-add-btn');
    if (newPointButton) {
      newPointButton.disabled = true;
    }

    // Блокируем сортировку
    const sortInputs = document.querySelectorAll('.trip-sort__input');
    sortInputs.forEach((input) => {
      input.disabled = true;
    });

    // Блокируем фильтры
    const filterInputs = document.querySelectorAll('.trip-filters__filter-input');
    filterInputs.forEach((input) => {
      input.disabled = true;
    });

    // Блокируем кнопки в открытых формах
    document.querySelectorAll('.event__save-btn, .event__reset-btn, .event__rollup-btn').forEach((button) => {
      button.disabled = true;
    });

    console.log('Все элементы управления заблокированы');
  }

  #unblockAllControls() {
    const hasPoints = this.#tripsModel.trips.length > 0;

    // Разблокируем все кнопки edit у точек
    this.#pointPresenters.forEach((presenter) => {
      presenter.setEnabled();
    });

    // Разблокируем кнопку добавления новой точки если мы не в режиме создания
    const newPointButton = document.querySelector('.trip-main__event-add-btn');
    if (newPointButton && !this.isCreating()) {
      newPointButton.disabled = false;
    }

    // Разблокируем сортировку если есть точки
    const sortInputs = document.querySelectorAll('.trip-sort__input');
    sortInputs.forEach((input) => {
      input.disabled = !hasPoints;
    });

    // Разблокируем фильтры в зависимости от их состояния
    const filterPresenter = this.#filterModel.getFilterPresenter();
    if (filterPresenter) {
      filterPresenter.init(); // Переинициализируем фильтры с актуальным состоянием
    }

    // Разблокируем кнопки в открытых формах
    if (!this.isCreating()) {
      document.querySelectorAll('.event__save-btn, .event__reset-btn, .event__rollup-btn').forEach((button) => {
        button.disabled = false;
      });
    }

    console.log('Все элементы управления разблокированы');
  }
}
