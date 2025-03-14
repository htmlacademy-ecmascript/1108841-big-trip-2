import ApiService from '../framework/api-service.js';

export default class DestinationsApiService extends ApiService {
  constructor(endPoint, authorization) {
    super(endPoint, authorization);
  }

  get destinations() {
    return this._load({ url: 'destinations' })
      .then(ApiService.parseResponse);
  }
}
