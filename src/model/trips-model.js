import { getRandomArrayElement } from '../utils.js';

export default class TripsModel {
  #trips = [];

  constructor(service) {
    this.#trips = service.trips;
  }

  get trips() {
    return this.#trips;
  }

  setTrips(trips) {
    this.#trips = trips;
  }

  getRandomTrip() {
    return getRandomArrayElement(this.#trips);
  }

  updateTrip(updatedPoint) {
    const index = this.#trips.findIndex((trip) => trip.id === updatedPoint.id);

    if (index === -1) {
      return false;
    }

    this.#trips[index] = updatedPoint;
    return true;
  }

  addTrip(trip) {
    this.#trips.push(trip);
  }

  deleteTrip(id) {
    const index = this.#trips.findIndex((trip) => trip.id === id);

    if (index === -1) {
      return false;
    }

    this.#trips = [...this.#trips.slice(0, index), ...this.#trips.slice(index + 1)];
    return true;
  }
}
