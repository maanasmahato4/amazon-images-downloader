import playwright from 'playwright';
import randomUserAgent from 'random-useragent';

async function Scraper(search: string): Promise<string[]> {
	try {
		// defining the fake agent and browser
		const agent = randomUserAgent.getRandom();
		const browser = await playwright.chromium.launch({
			headless: false,
			channel: 'msedge',
		});
		const context = await browser.newContext({
			bypassCSP: true,
			userAgent: agent,
			viewport: { width: 1600, height: 900 },
			screen: { width: 1600, height: 900 },
		});
		const page = await context.newPage();

		// navigating to the amazon.com homepage
		await page.goto('https://www.amazon.com');
		await page.waitForLoadState('domcontentloaded');
		await page.waitForSelector('input.nav-input', { state: 'attached' });

		// fill the search box
		await page.fill('input.nav-input', search);
		await page.keyboard.press('Enter');

		// wait for the page to load
		await page.waitForSelector('div.s-result-item', { state: 'attached' });
		await page.waitForSelector('.s-pagination-item.s-pagination-next', {
			state: 'attached',
		});

		// scraping the data till the last available page
		let isNextEnabled: boolean = true;
		const products: Array<string> = [];

		while (isNextEnabled) {
			const productsCollection = await page.$$eval(
				'div.s-result-item',
				(cards) => {
					return cards.map((item): string => {
						const imgElement = item.querySelector('img')?.getAttribute('src');
						const img_url = imgElement ? imgElement : 'not available';
						return img_url;
					});
				},
			);

			productsCollection.forEach((product) => {
				products.push(product);
			});

			// validating the availability of the next button in pagination then deciding whether to paginate or stop.
			const NEXT_BUTTON_SELECTOR: string =
				'a.s-pagination-item.s-pagination-next.s-pagination-button';

			const NEXT_BUTTON_DISABLED_SELECTOR: string =
				'span.s-pagination-item.s-pagination-next.s-pagination-disabled';

			const nextButtonDisabledElement = await page.$(
				NEXT_BUTTON_DISABLED_SELECTOR,
			);
			const nextButtonElement = await page.$(NEXT_BUTTON_SELECTOR);

			if (!nextButtonDisabledElement && !nextButtonElement) {
				console.log('error both elements not found!');
				isNextEnabled = false;
				await browser.close();
				break;
			} else if (nextButtonElement) {
				console.log('Button is enabled');
				await page.click(NEXT_BUTTON_SELECTOR);
				await page.waitForLoadState('domcontentloaded');
				await page.waitForSelector('div.s-result-item', { state: 'attached' });
				await page.waitForSelector('.s-pagination-item.s-pagination-next', {
					state: 'attached',
				});
				continue;
			} else if (nextButtonDisabledElement) {
				console.log('Button is disabled');
				isNextEnabled = false;
			} else {
				console.error('error occured while looping');
				break;
			}
		}

		await browser.close();
		return products;
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

export default Scraper;
