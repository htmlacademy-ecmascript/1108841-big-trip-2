import { getRandomArrayElement } from '../utils.js';

export default class TripsModel {
  constructor(service) {
    this.trips = service.trips;
  }

  getRandomTrip() {
    return getRandomArrayElement(this.trips);
  }

  updateTrip(updatedPoint) {
    const index = this.trips.findIndex((trip) => trip.id === updatedPoint.id);

    if (index === -1) {
      return false;
    }

    this.trips[index] = updatedPoint;
    return true;
  }
}
