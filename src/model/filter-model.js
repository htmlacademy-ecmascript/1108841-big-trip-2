import { FilterType } from '../const.js';

export default class FilterModel {
  #filterType = FilterType.EVERYTHING;

  get filterType() {
    return this.#filterType;
  }

  setFilterType(filterType) {
    this.#filterType = filterType;
  }
}
