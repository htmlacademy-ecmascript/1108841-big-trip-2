const POINT_TYPES = ['taxi', 'bus', 'train', 'ship', 'drive', 'flight', 'check-in', 'sightseeing', 'restaurant'];

const DateFormat = {
  MONTH: 'MONTH',
  DAY: 'DAY',
  HOURS_MINUTES: 'HOURS_MINUTES',
  FULL: 'FULL'
};

const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = MINUTES_IN_HOUR * 24;

export { POINT_TYPES, DateFormat, MINUTES_IN_HOUR, MINUTES_IN_DAY };
