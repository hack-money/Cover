/* eslint-disable func-names */
const { bigNumberify } = require('ethers/utils');
const moment = require('moment');
const traveler = require('ether-time-traveler');

const {
    MAX_DURATION,
    ACTIVATION_DELAY,
    ORACLE_ACTIVATION_DELAY,
} = require('./constants');

function contextForSpecificTime(
    contextText,
    timeDuration,
    provider,
    functions
) {
    const now = bigNumberify(moment().format('X'));

    describe(contextText, function () {
        beforeEach(async function () {
            await traveler.advanceBlockAndSetTime(
                provider,
                now.add(timeDuration.toString()).toNumber()
            );
        });

        functions();

        afterEach(async function () {
            await traveler.advanceBlockAndSetTime(provider, now.toNumber());
        });
    });
}

function contextForOracleActivated(provider, functions) {
    const timeDuration = bigNumberify(
        ORACLE_ACTIVATION_DELAY.clone().add({ minutes: 1 }).asSeconds()
    );
    contextForSpecificTime(
        'when the Uniswap price oracle has activated',
        timeDuration,
        provider,
        functions
    );
}

function contextForOptionHasActivated(provider, functions) {
    const timeDuration = bigNumberify(
        ACTIVATION_DELAY.clone().add({ minutes: 1 }).asSeconds()
    );
    contextForSpecificTime(
        'when the option has activated but not expired',
        timeDuration,
        provider,
        functions
    );
}

function contextForOptionHasExpired(provider, functions) {
    const timeDuration = bigNumberify(
        ACTIVATION_DELAY.clone()
            .add(MAX_DURATION)
            .add({ minutes: 1 })
            .asSeconds()
    );
    contextForSpecificTime(
        'when the option has expired',
        timeDuration,
        provider,
        functions
    );
}

module.exports = {
    contextForSpecificTime,
    contextForOptionHasActivated,
    contextForOptionHasExpired,
    contextForOracleActivated,
};
