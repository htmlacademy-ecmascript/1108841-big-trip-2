import NewPointButtonView from './view/new-point-button-view.js';
import BoardPresenter from './presenter/board-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';
import DestinationsModel from './model/destinations-model.js';
import OffersModel from './model/offers-model.js';
import TripsModel from './model/trips-model.js';
import FilterModel from './model/filter-model.js';
import SortModel from './model/sort-model.js';
import PointsApiService from './api/api-service.js';
import { render } from './framework/render.js';

const AUTHORIZATION = 'Basic dXNlcjphcGFzc3dvcmQ=';
const END_POINT = 'https://23.objects.htmlacademy.pro/big-trip';

const siteTripMainElement = document.querySelector('.trip-main');
const siteFiltersElement = siteTripMainElement.querySelector('.trip-controls__filters');
const siteTripEventsElement = document.querySelector('.trip-events');

const apiService = new PointsApiService(END_POINT, AUTHORIZATION);

const destinationsModel = new DestinationsModel(apiService);
const offersModel = new OffersModel(apiService);
const tripsModel = new TripsModel(apiService);
const filterModel = new FilterModel();
const sortModel = new SortModel();

const boardPresenter = new BoardPresenter({
  container: siteTripEventsElement,
  destinationsModel,
  offersModel,
  tripsModel,
  filterModel,
  sortModel
});

const filterPresenter = new FilterPresenter({
  container: siteFiltersElement,
  filterModel,
  tripsModel,
  boardPresenter
});

const handleNewPointButtonClick = () => {
  boardPresenter.createPoint();
};

let newPointButtonComponent = null;

// Функция для создания кнопки New Point
const createNewPointButton = () => {
  if (newPointButtonComponent) {
    return;
  }

  newPointButtonComponent = new NewPointButtonView({
    onClick: handleNewPointButtonClick
  });

  render(newPointButtonComponent, siteTripMainElement);
};

// Инициализация приложения
boardPresenter.init(); // Показать индикатор загрузки

Promise.all([
  destinationsModel.init(),
  offersModel.init(),
  tripsModel.init()
])
  .then(() => {
    boardPresenter.setIsLoading(false);
    createNewPointButton();
    boardPresenter.init();
    filterPresenter.init();
  })
  .catch((err) => {
    boardPresenter.setIsLoading(false);
    // eslint-disable-next-line no-console
    console.error('Ошибка инициализации приложения:', err);
    boardPresenter.renderError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
  });
