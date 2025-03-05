export const adaptToClient = {
  point: (point) => ({
    id: point.id,
    basePrice: point.base_price,
    dateFrom: point.date_from,
    dateTo: point.date_to,
    destination: point.destination,
    isFavorite: point.is_favorite,
    offers: point.offers,
    type: point.type
  }),

  points: (points) => points.map(adaptToClient.point),

  destination: (destination) => ({
    id: destination.id,
    description: destination.description,
    name: destination.name,
    pictures: destination.pictures
  }),

  destinations: (destinations) => destinations.map(adaptToClient.destination),

  offer: (offer) => ({
    id: offer.id,
    title: offer.title,
    price: offer.price
  }),

  offers: (offers) => offers.map((offerGroup) => ({
    type: offerGroup.type,
    offers: offerGroup.offers.map(adaptToClient.offer)
  }))
};

export const adaptToServer = {
  point: (point) => {
    const adaptedPoint = {};

    adaptedPoint.id = point.id;
    adaptedPoint['base_price'] = parseInt(point.basePrice, 10);
    adaptedPoint['date_from'] = point.dateFrom;
    adaptedPoint['date_to'] = point.dateTo;
    adaptedPoint.destination = point.destination;
    adaptedPoint['is_favorite'] = point.isFavorite;
    adaptedPoint.offers = point.offers || [];
    adaptedPoint.type = point.type;

    if (isNaN(adaptedPoint['base_price'])) {
      adaptedPoint['base_price'] = 0;
    }

    if (!Array.isArray(adaptedPoint.offers)) {
      adaptedPoint.offers = [];
    }

    return adaptedPoint;
  }
};
