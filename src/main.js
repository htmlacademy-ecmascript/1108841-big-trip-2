import FilterView from './view/filter-view.js';
import NewPointButtonView from './view/new-point-button-view.js';
import BoardPresenter from './presenter/board-presenter.js';
import DestinationsModel from './model/destinations-model.js';
import OffersModel from './model/offers-model.js';
import TripsModel from './model/trips-model.js';
import FilterModel from './model/filter-model.js';
import SortModel from './model/sort-model.js';
import { render } from './framework/render.js';
import { destinations } from './mock/destinations-data.js';
import { offers } from './mock/offers-data.js';
import { points } from './mock/points-data.js';
import { generateFilters } from './utils.js';

const mockService = {
  destinations,
  offers,
  trips: points
};

const siteTripMainElement = document.querySelector('.trip-main');
const siteFiltersElement = siteTripMainElement.querySelector('.trip-controls__filters');
const siteTripEventsElement = document.querySelector('.trip-events');

const destinationsModel = new DestinationsModel(mockService);
const offersModel = new OffersModel(mockService);
const tripsModel = new TripsModel(mockService);
const filterModel = new FilterModel();
const sortModel = new SortModel();

const filtersData = generateFilters(tripsModel.trips);

const boardPresenter = new BoardPresenter({
  container: siteTripEventsElement,
  destinationsModel,
  offersModel,
  tripsModel,
  filterModel,
  sortModel
});

const handleFilterTypeChange = (filterType) => {
  filterModel.setFilterType(filterType);
  boardPresenter.init();
};

render(new FilterView({
  filters: filtersData,
  currentFilterType: filterModel.filterType,
  onFilterTypeChange: handleFilterTypeChange
}), siteFiltersElement);

render(new NewPointButtonView(), siteTripMainElement);

boardPresenter.init();

