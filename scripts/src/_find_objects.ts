import { SuiGrpcClient } from '@mysten/sui/grpc';

const c = new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://fullnode.testnet.sui.io:443' });

(async () => {
  const r = await c.getTransaction({ 
    digest: 'AL133Jj44NV9euC6RreY1gjGHmCMwqfTcuKn6bbrKGqY', 
    include: { effects: true, objectChanges: true } 
  });
  
  // Print changed objects to find shared objects
  const effects = r.Transaction?.effects;
  if (effects?.changedObjects) {
    for (const obj of effects.changedObjects) {
      console.log(JSON.stringify(obj));
    }
  }
})();
