import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import keyPairJson from "../keypair.json" with { type: "json" };

/**
 *
 * Global variables
 *
 * These variables can be used throughout the exercise below.
 *
 */
const keypair = Ed25519Keypair.fromSecretKey(keyPairJson.privateKey);
const suiClient = new SuiGrpcClient({
	network: 'testnet',
	baseUrl: 'https://fullnode.testnet.sui.io:443',
});

const PACKAGE_ID =
	'0xd56e5075ba297f9e37085a37bb0abba69fabdf9987f8f4a6086a3693d88efbfd';

const CLOCK_OBJECT_ID = '0x6';

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
	while (true) {
		// Check window locally before spending gas on a doomed transaction
		const timestampSeconds = Math.floor(Date.now() / 1000);
		const timeInHour = timestampSeconds % 3600;
		const isOpen =
			(timeInHour >= 0 && timeInHour < 300) ||
			(timeInHour >= 1800 && timeInHour < 2100);

		if (!isOpen) {
			// Calculate seconds until next window
			let secsUntilNext: number;
			if (timeInHour < 300) {
				secsUntilNext = 300 - timeInHour; // shouldn't happen (isOpen would be true)
			} else if (timeInHour < 1800) {
				secsUntilNext = 1800 - timeInHour;
			} else if (timeInHour < 2100) {
				secsUntilNext = 2100 - timeInHour; // shouldn't happen (isOpen would be true)
			} else {
				secsUntilNext = 3600 - timeInHour; // wait until top of next hour
			}
			console.log(`Window closed (time_in_hour=${timeInHour}). Next window opens in ${secsUntilNext}s.`);
			await sleep(secsUntilNext * 1000);
			continue;
		}

		console.log(`Window is open (time_in_hour=${timeInHour}). Submitting transaction...`);
		try {
			const tx = new Transaction();

			const flag = tx.moveCall({
				target: `${PACKAGE_ID}::moving_window::extract_flag`,
				arguments: [tx.object(CLOCK_OBJECT_ID)],
			});

			tx.transferObjects([flag], keypair.toSuiAddress());

			const result = await suiClient.signAndExecuteTransaction({
				signer: keypair,
				transaction: tx,
				include: {
					effects: true,
					objectChanges: true,
					events: true,
				},
			});

			const txData = result.Transaction;
			console.log("Success!");
			console.log("Digest:", txData?.digest);
			console.dir(txData, { depth: null });
			break;
		} catch (error: any) {
			const msg = String(error?.message || error);

			if (msg.includes("insufficient SUI balance")) {
				console.error("Not enough testnet SUI for gas.");
				console.error("Fund this address, then rerun:");
				console.error(keypair.toSuiAddress());
				process.exit(1);
			}

			console.log("Window closed or tx failed, retrying in 5 seconds...");
			console.error(error);
			await sleep(5000);
		}
	}
})();