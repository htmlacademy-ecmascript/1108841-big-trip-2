import AbstractView from '../framework/view/abstract-view.js';
import { formatDate } from '../utils/date-format.js';
import { DateFormat, RoutePointCount } from '../const.js';
import SortUtils from '../utils/sort-utils.js';

function createTripRouteTemplate(destinations) {
  if (!destinations || destinations.length === 0) {
    return '';
  }
  if (destinations.length === RoutePointCount.SINGLE) {
    return destinations[0].name;
  }
  if (destinations.length === RoutePointCount.DOUBLE) {
    return `${destinations[0].name} &mdash; ${destinations[1].name}`;
  }
  if (destinations.length === RoutePointCount.TRIPLE) {
    return `${destinations[0].name} &mdash; ${destinations[1].name} &mdash; ${destinations[2].name}`;
  }
  return `${destinations[0].name} &mdash; ... &mdash; ${destinations[destinations.length - 1].name}`;
}

function createTripDatesTemplate(dateFrom, dateTo) {
  return `${formatDate(dateFrom, DateFormat.TRIP_INFO)} &mdash; ${formatDate(dateTo, DateFormat.TRIP_INFO)}`;
}

export default class TripInfoView extends AbstractView {
  #points = null;
  #destinations = null;
  #offers = null;

  constructor({points, destinations, offers}) {
    super();
    this.#points = points;
    this.#destinations = destinations;
    this.#offers = offers;
  }

  get template() {
    if (!this.#points || this.#points.length === 0) {
      return '<div class="trip-info"></div>';
    }
    const sortedPoints = [...this.#points].sort(SortUtils.sortByDay);
    const tripDestinations = sortedPoints.map((point) =>
      this.#destinations.find((dest) => dest.id === point.destination)
    ).filter(Boolean);
    if (tripDestinations.length === 0) {
      return '<div class="trip-info"></div>';
    }
    const totalPrice = this.#calculateTotalPrice();
    return `
      <section class="trip-main__trip-info trip-info">
        <div class="trip-info__main">
          <h1 class="trip-info__title">${createTripRouteTemplate(tripDestinations)}</h1>
          <p class="trip-info__dates">
            ${createTripDatesTemplate(sortedPoints[0].dateFrom, sortedPoints[sortedPoints.length - 1].dateTo)}
          </p>
        </div>
        <p class="trip-info__cost">
          Total: €&nbsp;<span class="trip-info__cost-value">${totalPrice}</span>
        </p>
      </section>
    `;
  }

  #calculateTotalPrice() {
    if (!this.#points || this.#points.length === 0) {
      return 0;
    }
    return this.#points.reduce((sum, point) => {
      const typeOffers = this.#offers.find((offer) => offer.type === point.type);
      if (!typeOffers) {
        return sum + point.basePrice;
      }
      const pointOffers = point.offers
        .map((offerId) => typeOffers.offers.find((offer) => offer.id === offerId))
        .filter(Boolean)
        .reduce((offerSum, offer) => offerSum + offer.price, 0);
      return sum + point.basePrice + pointOffers;
    }, 0);
  }
}
