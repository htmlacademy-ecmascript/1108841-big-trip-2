const POINT_TYPE_ITEMS = [
  'taxi',
  'bus',
  'train',
  'ship',
  'drive',
  'flight',
  'check-in',
  'sightseeing',
  'restaurant',
];
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = MINUTES_IN_HOUR * 24;
const HOURS_IN_DAY = 24;

const DateFormat = {
  MONTH: 'MONTH',
  DAY: 'DAY',
  HOURS_MINUTES: 'HOURS_MINUTES',
  FULL: 'FULL',
  DATE_PICKER: 'd/m/y H:i',
  DATE_DISPLAY: 'DD/MM/YY HH:mm',
  TRIP_INFO: 'DD MMM',
};

const DurationLabel = {
  DAY: 'D',
  HOUR: 'H',
  MINUTE: 'M',
};

const TimeUnit = {
  MINUTE: 'minute',
};

const RADIX = 36;
const ID_LENGTH = 2;

const PointIconSize = {
  SMALL: 17,
  MEDIUM: 28,
  LARGE: 42,
};

const DEFAULT_PRICE = 0;
const MIN_PRICE = 1;

const DEFAULT_ERROR_MESSAGE = 'Something went wrong...';

const ApiConfig = {
  END_POINT: 'https://22.objects.htmlacademy.pro/big-trip',
};

const ApiErrorMessage = {
  LOADING_POINTS: 'Не удалось загрузить точки маршрута',
  LOADING_OFFERS: 'Не удалось загрузить предложения',
  LOADING_DESTINATIONS: 'Не удалось загрузить пункты назначения',
  UPDATING_POINT: 'Не удалось обновить точку маршрута',
  ADDING_POINT: 'Не удалось добавить точку маршрута',
  DELETING_POINT: 'Не удалось удалить точку маршрута'
};

const SortLabel = {
  DAY: 'Day',
  EVENT: 'Event',
  TIME: 'Time',
  PRICE: 'Price',
  OFFER: 'Offers',
};

const FilterType = {
  EVERYTHING: 'everything',
  FUTURE: 'future',
  PRESENT: 'present',
  PAST: 'past',
};

const SortType = {
  DAY: 'day',
  EVENT: 'event',
  TIME: 'time',
  PRICE: 'price',
  OFFER: 'offer'
};

const SortTypeEnabledMap = {
  [SortType.DAY]: true,
  [SortType.EVENT]: false,
  [SortType.TIME]: true,
  [SortType.PRICE]: true,
  [SortType.OFFER]: false
};

const EmptyListMessageMap = {
  [FilterType.EVERYTHING]: 'Click New Event to create your first point',
  [FilterType.PAST]: 'There are no past events now',
  [FilterType.PRESENT]: 'There are no present events now',
  [FilterType.FUTURE]: 'There are no future events now',
};

const UserAction = {
  UPDATE_POINT: 'UPDATE_POINT',
  ADD_POINT: 'ADD_POINT',
  DELETE_POINT: 'DELETE_POINT',
};

const UpdateType = {
  PATCH: 'PATCH',
  MINOR: 'MINOR',
  MAJOR: 'MAJOR',
  FORCE: 'FORCE',
};

export {
  POINT_TYPE_ITEMS,
  DateFormat,
  DurationLabel,
  TimeUnit,
  MINUTES_IN_HOUR,
  MINUTES_IN_DAY,
  HOURS_IN_DAY,
  FilterType,
  EmptyListMessageMap,
  SortType,
  SortTypeEnabledMap,
  UserAction,
  UpdateType,
  RADIX,
  ID_LENGTH,
  PointIconSize,
  DEFAULT_PRICE,
  MIN_PRICE,
  DEFAULT_ERROR_MESSAGE,
  SortLabel,
  ApiConfig,
  ApiErrorMessage
};
