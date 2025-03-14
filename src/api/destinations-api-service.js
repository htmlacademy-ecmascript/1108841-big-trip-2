import ApiService from '../framework/api-service.js';

export default class DestinationsApiService extends ApiService {
  constructor(endPoint, authorization) {
    super(endPoint, authorization);
  }

  get destinations() {
    return this._load({ url: 'destinations' })
      .then(ApiService.parseResponse)
      .then((destinations) => destinations.map((destination) => this.#adaptDestinationToClient(destination)));
  }

  #adaptDestinationToClient(destination) {
    const adaptedDestination = {
      id: destination.id,
      description: destination.description,
      name: destination.name,
      pictures: destination.pictures
    };

    return adaptedDestination;
  }
}
