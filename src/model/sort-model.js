import { SortType } from '../const.js';
import Observable from '../framework/observable.js';

export default class SortModel extends Observable {
  #sortType = SortType.DAY;

  get sortType() {
    return this.#sortType;
  }

  setSortType(sortType) {
    this.#sortType = sortType;
    this._notify(sortType);
  }
}
