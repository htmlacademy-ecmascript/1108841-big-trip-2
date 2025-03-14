import BaseApiService from './base-api-service.js';

export default class DestinationsApiService extends BaseApiService {
  constructor(endPoint, authorization) {
    super(endPoint, authorization, 'destinations');
  }

  get destinations() {
    return this.data;
  }

  adaptDataToClient(destinations) {
    return destinations.map((destination) => this.#adaptDestinationToClient(destination));
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
