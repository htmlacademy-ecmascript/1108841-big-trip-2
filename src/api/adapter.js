const ToClientAdapter = {
  convertPoint: (point) => ({
    id: point.id,
    basePrice: point.base_price,
    dateFrom: point.date_from,
    dateTo: point.date_to,
    destination: point.destination,
    isFavorite: point.is_favorite,
    offers: point.offers,
    type: point.type
  }),

  convertPoints: (points) => points.map(ToClientAdapter.convertPoint),

  convertDestination: (destination) => ({
    id: destination.id,
    description: destination.description,
    name: destination.name,
    pictures: destination.pictures
  }),

  convertDestinations: (destinations) => destinations.map(ToClientAdapter.convertDestination),

  convertOffer: (offer) => ({
    id: offer.id,
    title: offer.title,
    price: offer.price
  }),

  convertOffers: (offers) => offers.map((offerGroup) => ({
    type: offerGroup.type,
    offers: offerGroup.offers.map(ToClientAdapter.convertOffer)
  }))
};

const ToServerAdapter = {
  convertPoint: (point) => {
    const adaptedPoint = {};

    adaptedPoint.id = point.id;
    adaptedPoint['base_price'] = point.basePrice;
    adaptedPoint['date_from'] = point.dateFrom;
    adaptedPoint['date_to'] = point.dateTo;
    adaptedPoint.destination = point.destination;
    adaptedPoint['is_favorite'] = point.isFavorite;
    adaptedPoint.offers = point.offers || [];
    adaptedPoint.type = point.type;

    if (isNaN(adaptedPoint['base_price']) || adaptedPoint['base_price'] < 0) {
      adaptedPoint['base_price'] = 0;
    }

    return adaptedPoint;
  }
};

export { ToClientAdapter, ToServerAdapter };
