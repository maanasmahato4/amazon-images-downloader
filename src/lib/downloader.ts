import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export default async function Downloader(name: string, urls: string[]) {
	const targetDirPath = path.join(process.cwd(), 'images', name);

	// Check if directory exists and create it if not
	if (!fs.existsSync(targetDirPath)) {
		await fs.promises.mkdir(targetDirPath, { recursive: true });
	}

	try {
		// Use map to create an array of download promises
		const downloadPromises = urls.map(async (url) => {
			const imagePath = path.join(targetDirPath, `${Date.now()}.png`);
			const response = await axios.get(url, { responseType: 'stream' });

			const writer = fs.createWriteStream(imagePath);
			response.data.pipe(writer);

			return new Promise((resolve, reject) => {
				writer.on('finish', resolve);
				writer.on('error', reject);
			});
		});

		// Wait for all downloads to finish
		await Promise.all(downloadPromises);
	} catch (error) {
		return;
	}
}
