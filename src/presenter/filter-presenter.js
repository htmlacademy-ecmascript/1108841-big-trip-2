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
    const hasFuturePoints = points.some(isPointFuture);
    const hasPresentPoints = points.some(isPointPresent);
    const hasPastPoints = points.some(isPointPast);
    return [
      {
        type: FilterType.EVERYTHING,
        name: 'Everything',
        disabled: points.length === 0
      },
      {
        type: FilterType.FUTURE,
        name: 'Future',
        disabled: !hasFuturePoints
      },
      {
        type: FilterType.PRESENT,
        name: 'Present',
        disabled: !hasPresentPoints
      },
      {
        type: FilterType.PAST,
        name: 'Past',
        disabled: !hasPastPoints
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
    if (this.#filterComponent) {
      this.#filterComponent.updateFilter(this.#filterModel.filterType);
    } else {
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
    this.#filterModel.setFilterType(filterType);
    if (this.#boardPresenter) {
      this.#boardPresenter.resetSortType(false);
    }
    this.updateFilterInDOM();
  };

  #handleModelEvent = () => {
    this.init();
    this.updateFilterInDOM();
  };
}
