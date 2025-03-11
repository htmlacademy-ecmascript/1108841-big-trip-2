import { SortType, UpdateType } from '../const.js';
import Observable from '../framework/observable.js';

export default class SortModel extends Observable {
  #sortType = SortType.DAY;

  get sortType() {
    return this.#sortType;
  }

  setSortType(sortType, silentUpdate = false) {
    this.#sortType = sortType;

    if (!silentUpdate) {
      this._notify(UpdateType.MAJOR, this.#sortType);
    }
  }
}
