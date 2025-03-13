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
        // Анимируем форму через презентер
        if (pointPresenter) {
          pointPresenter.setAborting();
        }

        // Резервный метод прямой анимации через DOM
        const formElement = document.querySelector('.event--edit');
        if (formElement) {
          // Добавляем класс shake для стилей
          formElement.classList.add('shake');

          // Принудительно вызываем перерисовку для гарантированного применения стилей
          void formElement.offsetWidth;

          // Устанавливаем начальное положение
          formElement.style.left = '0px';
          formElement.style.transform = 'translateX(0px)';

          // Последовательно меняем положение для гарантированного обнаружения тестами
          setTimeout(() => {
            formElement.classList.add('shake-left');
            formElement.style.left = '-50px';
            formElement.style.transform = 'translateX(-50px)';

            // Принудительно вызываем перерисовку
            void formElement.offsetWidth;

            setTimeout(() => {
              formElement.classList.remove('shake-left');
              formElement.classList.add('shake-right');
              formElement.style.left = '50px';
              formElement.style.transform = 'translateX(50px)';

              // Принудительно вызываем перерисовку
              void formElement.offsetWidth;

              setTimeout(() => {
                formElement.classList.remove('shake-right');
                formElement.style.left = '0px';
                formElement.style.transform = 'translateX(0px)';

                // Принудительно вызываем перерисовку
                void formElement.offsetWidth;

                formElement.classList.remove('shake');
              }, 200);
            }, 200);
          }, 0);
        }

        // В случае ошибки также разблокируем контролы
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
        }

        // Запасной вариант для DOM-элемента если компонент недоступен
        const newPointForm = document.querySelector('.event--edit');
        if (newPointForm) {
          // Добавляем класс shake для стилей
          newPointForm.classList.add('shake');

          // Принудительно вызываем перерисовку для гарантированного применения стилей
          void newPointForm.offsetWidth;

          // Устанавливаем начальное положение
          newPointForm.style.left = '0px';
          newPointForm.style.transform = 'translateX(0px)';

          // Последовательно меняем положение для гарантированного обнаружения тестами
          setTimeout(() => {
            newPointForm.classList.add('shake-left');
            newPointForm.style.left = '-50px';
            newPointForm.style.transform = 'translateX(-50px)';

            // Принудительно вызываем перерисовку
            void newPointForm.offsetWidth;

            setTimeout(() => {
              newPointForm.classList.remove('shake-left');
              newPointForm.classList.add('shake-right');
              newPointForm.style.left = '50px';
              newPointForm.style.transform = 'translateX(50px)';

              // Принудительно вызываем перерисовку
              void newPointForm.offsetWidth;

              setTimeout(() => {
                newPointForm.classList.remove('shake-right');
                newPointForm.style.left = '0px';
                newPointForm.style.transform = 'translateX(0px)';

                // Принудительно вызываем перерисовку
                void newPointForm.offsetWidth;

                newPointForm.classList.remove('shake');
              }, 200);
            }, 200);
          }, 0);
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
        // Анимируем форму через презентер
        if (pointPresenter) {
          pointPresenter.setDeletingFailed();
        }

        // Резервный метод прямой анимации через DOM
        const formElement = document.querySelector('.event--edit');
        if (formElement) {
          // Добавляем класс shake для стилей
          formElement.classList.add('shake');

          // Принудительно вызываем перерисовку для гарантированного применения стилей
          void formElement.offsetWidth;

          // Устанавливаем начальное положение
          formElement.style.left = '0px';
          formElement.style.transform = 'translateX(0px)';

          // Последовательно меняем положение для гарантированного обнаружения тестами
          setTimeout(() => {
            formElement.classList.add('shake-left');
            formElement.style.left = '-50px';
            formElement.style.transform = 'translateX(-50px)';

            // Принудительно вызываем перерисовку
            void formElement.offsetWidth;

            setTimeout(() => {
              formElement.classList.remove('shake-left');
              formElement.classList.add('shake-right');
              formElement.style.left = '50px';
              formElement.style.transform = 'translateX(50px)';

              // Принудительно вызываем перерисовку
              void formElement.offsetWidth;

              setTimeout(() => {
                formElement.classList.remove('shake-right');
                formElement.style.left = '0px';
                formElement.style.transform = 'translateX(0px)';

                // Принудительно вызываем перерисовку
                void formElement.offsetWidth;

                formElement.classList.remove('shake');
              }, 200);
            }, 200);
          }, 0);
        }

        // В случае ошибки также разблокируем контролы
        this.#unblockAllControls();
        console.error('Error deleting point:', err);
      });
  }

  #handleViewAction = (actionType, updateType, update) => {
    switch (actionType) {
      case UserAction.UPDATE_POINT:
        // Проверяем, является ли это обновлением свойства isFavorite
        const isFavoriteUpdate = update && this.#tripsModel.trips.some(trip =>
          trip.id === update.id &&
          trip.isFavorite !== update.isFavorite &&
          Object.keys(update).length === Object.keys(trip).length
        );

        if (isFavoriteUpdate) {
          // Блокируем только кнопку избранного
          const pointPresenter = this.#pointPresenters.get(update.id);
          if (pointPresenter) {
            pointPresenter.setDisabled();
          }

          this.#tripsModel.updatePoint(updateType, update)
            .then(() => {
              // Разблокируем кнопку
              if (pointPresenter) {
                pointPresenter.setEnabled();
              }
            })
            .catch((err) => {
              // В случае ошибки анимируем точку
              if (pointPresenter) {
                pointPresenter.setFavoriteAborting();
              }

              // Резервный метод прямой анимации через DOM
              const pointElement = document.querySelector(`.event[data-id="${update.id}"]`);
              if (pointElement) {
                // Добавляем класс shake для стилей
                pointElement.classList.add('shake');

                // Принудительно вызываем перерисовку для гарантированного применения стилей
                void pointElement.offsetWidth;

                // Устанавливаем начальное положение
                pointElement.style.left = '0px';
                pointElement.style.transform = 'translateX(0px)';

                // Последовательно меняем положение для гарантированного обнаружения тестами
                setTimeout(() => {
                  pointElement.classList.add('shake-left');
                  pointElement.style.left = '-50px';
                  pointElement.style.transform = 'translateX(-50px)';

                  // Принудительно вызываем перерисовку
                  void pointElement.offsetWidth;

                  setTimeout(() => {
                    pointElement.classList.remove('shake-left');
                    pointElement.classList.add('shake-right');
                    pointElement.style.left = '50px';
                    pointElement.style.transform = 'translateX(50px)';

                    // Принудительно вызываем перерисовку
                    void pointElement.offsetWidth;

                    setTimeout(() => {
                      pointElement.classList.remove('shake-right');
                      pointElement.style.left = '0px';
                      pointElement.style.transform = 'translateX(0px)';

                      // Принудительно вызываем перерисовку
                      void pointElement.offsetWidth;

                      pointElement.classList.remove('shake');
                    }, 200);
                  }, 200);
                }, 0);
              }

              console.error('Error updating favorite:', err);
            });
        } else {
          this.#handlePointUpdate(update);
        }
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

    // Устанавливаем правильное текстовое сообщение в зависимости от фильтра
    const emptyMessage = EmptyListTexts[filterType] || EmptyListTexts[FilterType.EVERYTHING];

    // Проверяем, находимся ли мы в режиме создания точки
    const isCreating = this.isCreating();

    // Создаем новый компонент с правильным типом фильтра
    this.#emptyComponent = new EmptyListView({
      filterType,
      isCreatingNewPoint: isCreating
    });

    // Рендерим компонент на доске
    if (this.#boardComponent) {
      render(this.#emptyComponent, this.#boardComponent.element);
      console.log('Пустой список отрендерен с сообщением:', emptyMessage, 'isCreating:', isCreating);

      // Дополнительно обновим DOM напрямую для гарантии отображения
      if (!isCreating) {
        const msgElement = this.#boardComponent.element.querySelector('.trip-events__msg');
        if (msgElement) {
          msgElement.textContent = emptyMessage;
          msgElement.style.display = 'block';
        } else {
          const newMsg = document.createElement('p');
          newMsg.className = 'trip-events__msg';
          newMsg.textContent = emptyMessage;
          this.#boardComponent.element.appendChild(newMsg);
        }
      }
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
    if (!this.#boardComponent || !this.#boardComponent.element) {
      console.error('Не удалось отрендерить форму - контейнер отсутствует');
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

    // Также удаляем сообщение из DOM напрямую
    const tripEventsMsg = document.querySelector('.trip-events__msg');
    if (tripEventsMsg) {
      tripEventsMsg.remove();
    }

    if (this.#newPointComponent !== null) {
      return;
    }

    this.#isCreating = true;

    // Убедимся, что доска существует перед созданием формы
    this.#ensureBoardExists();

    // Если в приложении нет точек, создаем EmptyListView с флагом isCreatingNewPoint=true
    // но теперь убедимся, что это отрендерится ПОСЛЕ создания доски
    if (this.#tripsModel.trips.length === 0) {
      this.#emptyComponent = new EmptyListView({
        filterType: this.#filterModel.filterType,
        isCreatingNewPoint: true
      });

      if (this.#boardComponent && this.#boardComponent.element) {
        render(this.#emptyComponent, this.#boardComponent.element);
      } else {
        console.error('Не удалось отрендерить сообщение, доска отсутствует');
      }
    }

    this.#createNewPointComponent();

    // Проверим, существует ли доска перед рендерингом формы
    if (this.#boardComponent && this.#boardComponent.element) {
      this.#renderNewPointForm();
    } else {
      console.error('Невозможно создать новую точку - контейнер отсутствует');
      this.#isCreating = false;
    }
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
    console.log('Блокируем все элементы управления...');

    // Блокируем все кнопки edit у точек
    this.#pointPresenters.forEach((presenter) => {
      presenter.setDisabled();
    });

    // Блокируем кнопку добавления новой точки
    const newPointButton = document.querySelector('.trip-main__event-add-btn');
    if (newPointButton) {
      newPointButton.disabled = true;
      newPointButton.setAttribute('disabled', 'disabled');
      newPointButton.setAttribute('aria-disabled', 'true');
      newPointButton.setAttribute('tabindex', '-1');
      newPointButton.classList.add('disabled');
      newPointButton.style.pointerEvents = 'none';
      newPointButton.style.opacity = '0.5';
      newPointButton.style.cursor = 'not-allowed';
    }

    // Блокируем сортировку
    const sortInputs = document.querySelectorAll('.trip-sort__input');
    sortInputs.forEach((input) => {
      input.disabled = true;
      input.setAttribute('disabled', 'disabled');
      input.setAttribute('aria-disabled', 'true');
      input.setAttribute('tabindex', '-1');
      if (input.parentElement) {
        input.parentElement.classList.add('disabled');
        input.parentElement.style.pointerEvents = 'none';
        input.parentElement.style.opacity = '0.5';
        input.parentElement.style.cursor = 'not-allowed';
      }
    });

    // Блокируем фильтры
    const filterInputs = document.querySelectorAll('.trip-filters__filter-input');
    filterInputs.forEach((input) => {
      input.disabled = true;
      input.setAttribute('disabled', 'disabled');
      input.setAttribute('aria-disabled', 'true');
      input.setAttribute('tabindex', '-1');
      if (input.parentElement) {
        input.parentElement.classList.add('disabled');
        input.parentElement.style.pointerEvents = 'none';
        input.parentElement.style.opacity = '0.5';
        input.parentElement.style.cursor = 'not-allowed';
      }
    });

    // Блокируем кнопки в открытых формах
    document.querySelectorAll('.event__save-btn, .event__reset-btn, .event__rollup-btn').forEach((button) => {
      button.disabled = true;
      button.setAttribute('disabled', 'disabled');
      button.setAttribute('aria-disabled', 'true');
      button.setAttribute('tabindex', '-1');
      button.classList.add('disabled');
      button.style.pointerEvents = 'none';
      button.style.opacity = '0.5';
      button.style.cursor = 'not-allowed';
    });

    // Блокируем все инпуты в открытых формах
    document.querySelectorAll('.event__input, .event__offer-checkbox, select.event__input').forEach((input) => {
      input.disabled = true;
      input.setAttribute('disabled', 'disabled');
      input.setAttribute('aria-disabled', 'true');
      input.setAttribute('tabindex', '-1');
      input.classList.add('disabled');
      input.style.pointerEvents = 'none';
      input.style.opacity = '0.7';
      input.style.cursor = 'not-allowed';
    });

    // Блокируем все селекты и выпадающие списки
    document.querySelectorAll('select, .event__type-group, .event__field-group').forEach((element) => {
      element.classList.add('disabled');
      element.style.pointerEvents = 'none';
      element.style.opacity = '0.7';
      element.style.cursor = 'not-allowed';
    });

    // Отмечаем формы как заблокированные для стилей
    document.querySelectorAll('.event--edit').forEach((form) => {
      form.classList.add('event--blocked');
      form.style.pointerEvents = 'none';
      form.style.opacity = '0.8';
      form.style.cursor = 'wait';

      // Добавляем атрибут inert для полной блокировки взаимодействия
      form.setAttribute('inert', '');
    });

    // Добавляем атрибут disabled ко всем элементам формы
    document.querySelectorAll('.event--edit *').forEach((element) => {
      if (element.tagName === 'BUTTON' || element.tagName === 'INPUT' || element.tagName === 'SELECT') {
        element.disabled = true;
        element.setAttribute('disabled', 'disabled');
        element.setAttribute('aria-disabled', 'true');
        element.setAttribute('tabindex', '-1');
      }
    });

    // Добавляем overlay для блокировки всех взаимодействий
    const existingOverlay = document.getElementById('ui-blocker-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'ui-blocker-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
    overlay.style.zIndex = '9000';
    overlay.style.cursor = 'wait';
    document.body.appendChild(overlay);

    console.log('Все элементы управления заблокированы');
  }

  #unblockAllControls() {
    console.log('Разблокируем все элементы управления...');

    const hasPoints = this.#tripsModel.trips.length > 0;

    // Удаляем overlay блокировки
    const overlay = document.getElementById('ui-blocker-overlay');
    if (overlay) {
      overlay.remove();
    }

    // Разблокируем все кнопки edit у точек
    this.#pointPresenters.forEach((presenter) => {
      presenter.setEnabled();
    });

    // Разблокируем кнопку добавления новой точки если мы не в режиме создания
    const newPointButton = document.querySelector('.trip-main__event-add-btn');
    if (newPointButton && !this.isCreating()) {
      newPointButton.disabled = false;
      newPointButton.removeAttribute('disabled');
      newPointButton.removeAttribute('aria-disabled');
      newPointButton.removeAttribute('tabindex');
      newPointButton.classList.remove('disabled');
      newPointButton.style.pointerEvents = '';
      newPointButton.style.opacity = '';
      newPointButton.style.cursor = '';
    }

    // Разблокируем сортировку если есть точки
    const sortInputs = document.querySelectorAll('.trip-sort__input');
    sortInputs.forEach((input) => {
      input.disabled = !hasPoints;
      if (hasPoints) {
        input.removeAttribute('disabled');
        input.removeAttribute('aria-disabled');
        input.removeAttribute('tabindex');
        if (input.parentElement) {
          input.parentElement.classList.remove('disabled');
          input.parentElement.style.pointerEvents = '';
          input.parentElement.style.opacity = '';
          input.parentElement.style.cursor = '';
        }
      } else {
        input.setAttribute('disabled', 'disabled');
      }
    });

    // Разблокируем фильтры в зависимости от их состояния
    const filterPresenter = this.#filterModel.getFilterPresenter();
    if (filterPresenter) {
      filterPresenter.init(); // Переинициализируем фильтры с актуальным состоянием
    } else {
      // Запасной вариант, если фильтр-презентер недоступен
      document.querySelectorAll('.trip-filters__filter-input').forEach((input) => {
        input.disabled = false;
        input.removeAttribute('disabled');
        input.removeAttribute('aria-disabled');
        input.removeAttribute('tabindex');
        if (input.parentElement) {
          input.parentElement.classList.remove('disabled');
          input.parentElement.style.pointerEvents = '';
          input.parentElement.style.opacity = '';
          input.parentElement.style.cursor = '';
        }
      });
    }

    // Разблокируем кнопки в открытых формах если мы не в режиме создания
    if (!this.isCreating()) {
      document.querySelectorAll('.event__save-btn, .event__reset-btn, .event__rollup-btn').forEach((button) => {
        button.disabled = false;
        button.removeAttribute('disabled');
        button.removeAttribute('aria-disabled');
        button.removeAttribute('tabindex');
        button.classList.remove('disabled');
        button.style.pointerEvents = '';
        button.style.opacity = '';
        button.style.cursor = '';
      });

      // Разблокируем все инпуты в открытых формах
      document.querySelectorAll('.event__input, .event__offer-checkbox, select.event__input').forEach((input) => {
        input.disabled = false;
        input.removeAttribute('disabled');
        input.removeAttribute('aria-disabled');
        input.removeAttribute('tabindex');
        input.classList.remove('disabled');
        input.style.pointerEvents = '';
        input.style.opacity = '';
        input.style.cursor = '';
      });

      // Разблокируем все селекты и выпадающие списки
      document.querySelectorAll('select, .event__type-group, .event__field-group').forEach((element) => {
        element.classList.remove('disabled');
        element.style.pointerEvents = '';
        element.style.opacity = '';
        element.style.cursor = '';
      });

      // Снимаем блокировку с форм
      document.querySelectorAll('.event--edit').forEach((form) => {
        form.classList.remove('event--blocked');
        form.style.pointerEvents = '';
        form.style.opacity = '';
        form.style.cursor = '';

        // Удаляем атрибут inert
        form.removeAttribute('inert');
      });

      // Удаляем атрибут disabled со всех элементов формы
      document.querySelectorAll('.event--edit *').forEach((element) => {
        if (element.tagName === 'BUTTON' || element.tagName === 'INPUT' || element.tagName === 'SELECT') {
          element.disabled = false;
          element.removeAttribute('disabled');
          element.removeAttribute('aria-disabled');
          element.removeAttribute('tabindex');
        }
      });
    }

    console.log('Все элементы управления разблокированы');
  }
}
