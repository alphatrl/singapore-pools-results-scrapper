import { Browser } from 'puppeteer';

/**
 * @param {import('puppeteer').Browser} browser
 * @returns Promise(list)
 *
 * Scrape 4D results from Singapore Pools
 */
export default async function fourD(
  browser: Browser
): Promise<Record<string, unknown>[] | []> {
  const page = await browser.newPage();
  await page.goto(
    'http://www.singaporepools.com.sg/en/product/Pages/4d_results.aspx'
  );

  const results = await page
    .evaluate(() => {
      const items = [...document.querySelectorAll('.tables-wrap')];

      return items.map((item) => {
        const drawNo = Number(
          item.querySelector('.drawNumber').textContent.trim().split(' ')[2]
        );
        const drawDate = Date.parse(
          item.querySelector('.drawDate').textContent.trim()
        );

        const winning = [
          Number(item.querySelector('.tdFirstPrize').textContent.trim()),
          Number(item.querySelector('.tdSecondPrize').textContent.trim()),
          Number(item.querySelector('.tdThirdPrize').textContent.trim()),
        ];

        const starterNode = item
          .querySelector('.tbodyStarterPrizes')
          .getElementsByTagName('td');
        const starter = [];
        for (let index = 0; index < starterNode.length; index++) {
          starter.push(Number(starterNode[index].textContent));
        }

        const consolationNode = item
          .querySelector('.tbodyConsolationPrizes')
          .getElementsByTagName('td');
        const consolation = [];
        for (let index = 0; index < consolationNode.length; index++) {
          consolation.push(Number(consolationNode[index].textContent));
        }

        return {
          drawNo: drawNo,
          drawDate: drawDate,
          winning: winning,
          starter: starter,
          consolation: consolation,
        };
      });
    })
    .catch((error: Error) => {
      console.error(error);
      return [];
    });

  await page.close();
  console.log(`[4D] - scraped ${results.length} items`);
  return results;
}