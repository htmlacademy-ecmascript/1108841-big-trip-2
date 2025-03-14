import ApiService from '../framework/api-service.js';

export default class BaseApiService extends ApiService {
  #endpoint = '';

  constructor(endPoint, authorization, endpoint) {
    super(endPoint, authorization);
    this.#endpoint = endpoint;
  }

  get data() {
    return this._load({ url: this.#endpoint })
      .then(ApiService.parseResponse)
      .then((data) => this.adaptDataToClient(data));
  }

  adaptDataToClient() {
    throw new Error('Abstract method not implemented: adaptDataToClient');
  }
}
