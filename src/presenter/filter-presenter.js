import FilterView from '../view/filter-view.js';
import { render, replace, remove } from '../utils/render-utils.js';
import { FilterType } from '../const.js';
import { isPointFuture, isPointPresent, isPointPast } from '../utils/filter.js';

export default class FilterPresenter {
  #filterContainer = null;
  #filterModel = null;
  #tripsModel = null;
  #filterComponent = null;
  #boardPresenter = null;

  constructor({ container, filterModel, tripsModel, boardPresenter }) {
    this.#filterContainer = container;
    this.#filterModel = filterModel;
    this.#tripsModel = tripsModel;
    this.#boardPresenter = boardPresenter;

    this.#tripsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
  }

  get filters() {
    const points = this.#tripsModel.trips;

    // Проверяем каждый фильтр на наличие точек
    const hasFuturePoints = points.some(isPointFuture);
    const hasPresentPoints = points.some(isPointPresent);
    const hasPastPoints = points.some(isPointPast);

    return [
      {
        type: FilterType.EVERYTHING,
        name: 'Everything',
        disabled: points.length === 0 // Отключаем, если нет вообще точек
      },
      {
        type: FilterType.FUTURE,
        name: 'Future',
        disabled: !hasFuturePoints // Отключаем, если нет будущих точек
      },
      {
        type: FilterType.PRESENT,
        name: 'Present',
        disabled: !hasPresentPoints // Отключаем, если нет текущих точек
      },
      {
        type: FilterType.PAST,
        name: 'Past',
        disabled: !hasPastPoints // Отключаем, если нет прошлых точек
      },
    ];
  }

  init() {
    const filters = this.filters;
    const prevFilterComponent = this.#filterComponent;

    this.#filterComponent = new FilterView({
      filters,
      currentFilterType: this.#filterModel.filterType,
      onFilterTypeChange: this.#handleFilterTypeChange,
    });

    if (prevFilterComponent === null) {
      render(this.#filterComponent, this.#filterContainer);
      return;
    }

    replace(this.#filterComponent, prevFilterComponent);
    remove(prevFilterComponent);
  }

  updateFilterInDOM() {
    // Программно обновляем состояние фильтра в DOM
    if (this.#filterComponent) {
      this.#filterComponent.updateFilter(this.#filterModel.filterType);
    } else {
      // Если компонент еще не создан, просто проставляем в DOM
      const filterInput = document.querySelector(`#filter-${this.#filterModel.filterType}`);
      if (filterInput) {
        filterInput.checked = true;
      }
    }
  }

  #handleFilterTypeChange = (filterType) => {
    if (this.#filterModel.filterType === filterType) {
      return;
    }

    if (this.#boardPresenter.isCreating()) {
      return;
    }

    // Устанавливаем новый тип фильтра в модели
    this.#filterModel.setFilterType(filterType);

    // Сбрасываем сортировку на "Day" и обновляем DOM
    if (this.#boardPresenter) {
      this.#boardPresenter.resetSortType(false); // Явно указываем false для прямого обновления
    }

    // Обновляем отображение фильтров в DOM
    this.updateFilterInDOM();

    console.log(`Фильтр изменен на: ${filterType}, сортировка сброшена на 'day'`);
  };

  #handleModelEvent = () => {
    this.init();

    // Обновляем состояние фильтров в DOM после любого события модели
    this.updateFilterInDOM();
  };
}
