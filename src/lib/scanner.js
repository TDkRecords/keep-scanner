import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

export async function scanBarcode() {
	const { camera } = await BarcodeScanner.requestPermissions();

	if (camera !== 'granted' && camera !== 'limited') {
		throw new Error('Permiso de cámara denegado');
	}

	const { barcodes } = await BarcodeScanner.scan();

	if (barcodes.length === 0) return null;

	return barcodes[0].displayValue;
}
