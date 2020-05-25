const { duration } = require('moment');

const MIN_DURATION = duration({ days: 1 });
const MAX_DURATION = duration({ weeks: 8 });
const VALID_DURATION = duration({ weeks: 4 });
const ACTIVATION_DELAY = duration({ minutes: 15 });
const ORACLE_ACTIVATION_DELAY = duration({ days: 1 });

module.exports = {
    MIN_DURATION,
    MAX_DURATION,
    VALID_DURATION,
    ACTIVATION_DELAY,
    ORACLE_ACTIVATION_DELAY,
};
