const Handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

const { t } = require('typy');

function getNetworkNameForSubgraph() {
  switch (process.env.SUBGRAPH) {
    case undefined:
    case 'thomas-waite/hack':
      return 'mainnet';
    case 'thomas-waite/hack-goerli':
      return 'goerli';
    case 'thomas-waite/hack-kovan':
      return 'kovan';
    case 'thomas-waite/hack-rinkeby':
      return 'rinkeby';
    case 'thomas-waite/hack-ropsten':
      return 'ropsten';
    case 'thomas-waite/hack-local':
      return 'local';
    default:
      return null;
  }
}

(async () => {
  const networksFilePath = path.join(__dirname, 'networks.yaml');
  const networks = yaml.load(
    await fs.readFile(networksFilePath, { encoding: 'utf-8' }),
  );

  const networkName = process.env.NETWORK_NAME || getNetworkNameForSubgraph();
  const network = t(networks, networkName).safeObject;
  if (t(network).isFalsy) {
    throw new Error(
      'Please set either a "NETWORK_NAME" or a "SUBGRAPH" environment variable',
    );
  }

  const subgraphTemplateFilePath = path.join(
    __dirname,
    'subgraph.template.yaml',
  );
  const source = await fs.readFile(subgraphTemplateFilePath, 'utf-8');
  const template = Handlebars.compile(source);
  const result = template(network);
  await fs.writeFile(path.join(__dirname, 'subgraph.yaml'), result);

  // eslint-disable-next-line no-console
  console.log('🎉 subgraph.yaml successfully generated');
})();
