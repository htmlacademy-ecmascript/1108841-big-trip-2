import BaseDataModel from './base-data-model.js';

export default class DestinationsModel extends BaseDataModel {
  constructor(apiService) {
    super(apiService, 'destinations');
  }

  get destinations() {
    return this.data;
  }

  getById(id) {
    return this.destinations.find((destination) => destination.id === id);
  }
}
