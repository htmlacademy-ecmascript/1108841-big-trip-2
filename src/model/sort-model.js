import { SortType } from '../const.js';

export default class SortModel {
  #sortType = SortType.DAY;

  get sortType() {
    return this.#sortType;
  }

  setSortType(sortType) {
    this.#sortType = sortType;
  }
}
