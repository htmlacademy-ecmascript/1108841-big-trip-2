import FilterView from '../view/filter-view.js';
import { render, replace, remove } from '../framework/render.js';
import { generateFilters } from '../utils/filter.js';

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

  init() {
    const points = this.#tripsModel.trips;
    const filters = generateFilters(points);
    const prevFilterComponent = this.#filterComponent;

    this.#filterComponent = new FilterView({
      filters,
      currentFilterType: this.#filterModel.filterType,
      onFilterTypeChange: this.#handleFilterTypeChange
    });

    if (prevFilterComponent === null) {
      render(this.#filterComponent, this.#filterContainer);
      return;
    }

    replace(this.#filterComponent, prevFilterComponent);
    remove(prevFilterComponent);
  }

  #handleFilterTypeChange = (filterType) => {
    if (this.#filterModel.filterType === filterType) {
      return;
    }

    this.#filterModel.setFilterType(filterType);
    this.#boardPresenter.resetSortType();
    this.#boardPresenter.init();
  };

  #handleModelEvent = () => {
    this.init();
  };
}
