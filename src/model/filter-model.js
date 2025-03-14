import { FilterType, UpdateType } from '../const.js';
import Observable from '../framework/observable.js';
export default class FilterModel extends Observable {
  #filterType = FilterType.EVERYTHING;
  #filterPresenter = null;
  get filterType() {
    return this.#filterType;
  }

  setFilterType(filterType, silentUpdate = false) {
    this.#filterType = filterType;
    if (!silentUpdate) {
      this._notify(UpdateType.MAJOR, this.#filterType);
    }
  }

  setFilterPresenter(filterPresenter) {
    this.#filterPresenter = filterPresenter;
  }

  getFilterPresenter() {
    return this.#filterPresenter;
  }
}
