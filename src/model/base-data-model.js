import Observable from '../framework/observable.js';
import { UpdateType } from '../const.js';

export default class BaseDataModel extends Observable {
  #data = [];
  #apiService = null;
  #hasError = false;
  #dataName = '';

  constructor(apiService, dataName) {
    super();
    this.#apiService = apiService;
    this.#dataName = dataName;
  }

  async init() {
    try {
      const data = await this.#apiService[this.#dataName];
      this.#data = data;
      this.#hasError = false;
      this._notify(UpdateType.INIT);
    } catch (err) {
      this.#data = [];
      this.#hasError = true;
      this._notify(UpdateType.ERROR);
      throw new Error('Failed to load latest route information');
    }
  }

  get data() {
    return this.#data;
  }

  get hasError() {
    return this.#hasError;
  }

  setData(data) {
    this.#data = data;
  }
}
