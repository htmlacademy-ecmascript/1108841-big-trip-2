export default class DestinationsModel {
  constructor(service) {
    this.destinations = service.destinations;
  }

  getById(id) {
    return this.destinations.find((destination) => destination.id === id);
  }
}
