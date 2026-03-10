import { SuiGrpcClient } from '@mysten/sui/grpc';

const c = new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://fullnode.testnet.sui.io:443' });
const address = '0xebcaccab9c6b485bed3daad4329db536a0502ce117c06a5759035374d482cc49';
const USDC_TYPE = '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC';

(async () => {
  const { referenceGasPrice } = await c.getReferenceGasPrice();
  console.log('Gas price:', referenceGasPrice);

  // SUI coins
  const coins = await c.listCoins({ owner: address, limit: 5 });
  for (const coin of coins.objects) {
    console.log('SUI Coin:', coin.objectId, 'balance:', coin.balance, 'version:', coin.version, 'digest:', coin.digest);
  }

  // USDC coins
  const usdcCoins = await c.listCoins({ owner: address, coinType: `0x2::coin::Coin<${USDC_TYPE}>`, limit: 10 });
  console.log('USDC coins found:', usdcCoins.objects.length);
  for (const coin of usdcCoins.objects) {
    console.log('USDC Coin:', coin.objectId, 'balance:', coin.balance, 'version:', coin.version, 'digest:', coin.digest);
  }

  // Random object - get owner info for initialSharedVersion
  const { object: randObj } = await c.getObject({ objectId: '0x8', include: { owner: true } });
  console.log('Random object:', JSON.stringify(randObj, null, 2));
})();
