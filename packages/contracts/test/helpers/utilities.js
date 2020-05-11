const {
    bigNumberify,
    keccak256,
    solidityPack,
    getCreate2Address,
} = require('ethers/utils');

function expandTo18Decimals(n) {
    return bigNumberify(n).mul(bigNumberify(10).pow(18));
}

function getMarketAddress(
    factoryAddress,
    [poolToken, paymentToken],
    poolFactory,
    bytecode
) {
    const salt = keccak256(
        solidityPack(['address', 'address'], [poolToken, paymentToken])
    );
    const initCodeHash = keccak256(
        solidityPack(
            ['bytes', 'address', 'address', 'address'],
            [bytecode, poolToken, paymentToken, poolFactory]
        )
    );

    return getCreate2Address({
        from: factoryAddress,
        salt,
        initCodeHash,
    });
}

module.exports = {
    expandTo18Decimals,
    getMarketAddress,
};
