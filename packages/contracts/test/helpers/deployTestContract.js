const { deployContract } = require('ethereum-waffle');

async function deployTestContract(user, contractArtifact, constructorArgument) {
    const deployedContract = await deployContract(
        user,
        contractArtifact,
        constructorArgument,
        { gasLimit: 9999999 }
    );
    return deployedContract;
}

module.exports = { deployTestContract };
