import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Browser } from 'puppeteer';

dotenv.config();

import { FourD, Sweep, Toto } from '../sources/sg_lottery';
import getListKeyDifference from '../utils/compareList';
import { getJSON, getJSONLocal } from '../utils/networking';

const isProduction = process.env.NODE_ENV === 'production';
const fileName = 'sg_lottery';
const url = isProduction
  ? `https://alphatrl.github.io/sg-lottery-scraper/${fileName}.json`
  : `${path.resolve()}/temp/data/${fileName}.json`;

const DICT_KEY = {
  FourD: '4D',
  Toto: 'Toto',
  Sweep: 'Sweep',
};

const getLottery = async (browser: Browser) => {
  let fourD = [];
  let toto = [];
  let sweep = [];

  while (
    Object.keys(fourD).length === 0 ||
    Object.keys(toto).length === 0 ||
    Object.keys(sweep).length === 0
  ) {
    fourD = await FourD(browser);
    toto = await Toto(browser);
    sweep = await Sweep(browser);
  }

  return {
    FourD: fourD,
    Toto: toto,
    Sweep: sweep,
  };
};

const prepareTopic = (topics: string[]): Record<string, unknown>[] => {
  const topicList = [];

  for (const key of topics) {
    if (key in DICT_KEY) {
      topicList.push({
        topic: isProduction ? key : `${key}-Test`,
        title: `${DICT_KEY[key]} Results`,
        body: 'See the latest results',
      });
    }
  }
  return topicList;
};

export default async function singapore(
  browser: Browser
): Promise<Record<string, unknown>[]> {
  console.log('---------- Singapore ----------');

  const prevList = isProduction ? await getJSON(url) : await getJSONLocal(url);
  const lottery = await getLottery(browser);
  const difference = getListKeyDifference(lottery, prevList);
  const topicList = prepareTopic(difference);

  // write to file
  fs.writeFileSync(
    `./temp/data/${fileName}.json`,
    JSON.stringify(lottery, null, isProduction ? 0 : 2)
  );

  console.log('---------- Singapore [Fin] ----------');

  return topicList;
}
