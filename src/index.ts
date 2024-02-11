import Enquirer from 'enquirer';
import Scrapper from './lib/scraper';
import Downloader from './lib/downloader';

const enquirer = new Enquirer();

type TPrompt = {
	search: string;
	fileType: string;
};

enquirer
	.prompt({
		type: 'input',
		name: 'search',
		message: 'Search for?',
	})
	.then(async (value: unknown): Promise<void> => {
		const { search } = value as TPrompt;
		const urls = await Scrapper(search);
		await Downloader(search, urls);
	});
