import puppeteer from 'puppeteer'
import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';

import MODULES from '../modules.js';
import {getJSON, getJSONLocal} from './utils/networking.js';
import {default as verifyList} from './utils/compareList.js';

const isProduction = process.env.NODE_ENV === 'production';

if (!fs.existsSync('temp')) {
  fs.mkdirSync('temp')
}

const main = async () => {

  const browser = await puppeteer.launch({
    headless: isProduction,
    args: isProduction ? ['--no-sandbox'] : [],
  })

  for (const module of MODULES) {
    const module_name = Object.keys(module);
    const filename = path.join('temp', `${module_name}.json`);
    const url = isProduction ? `https://alphatrl.github.io/sg-lottery-scraper/${module_name}.json` : `${path.resolve()}/${filename}`;
    const backup_list = isProduction ? await getJSON(url) : await getJSONLocal(url);
    
    if (fs.existsSync(filename)) {
      fs.unlinkSync(filename)
    }

    var [lottery_list, is_different_list] = await module[module_name](browser).then(async (new_list) => {
      return await verifyList(new_list, backup_list);
    });

    fs.writeFileSync(filename, JSON.stringify(lottery_list, null, isProduction ? 0 : 2)); 
  }
  
  await browser.close();

  // push json to github
  if (process.env.GITHUB_TOKEN) {
    spawnSync(
      'dpl',
      [
        '--provider=pages',
        '--committer-from-gh',
        `--github-token=${process.env.GITHUB_TOKEN}`,
        `--repo=${process.env.GITHUB_REPO}`,
        '--local-dir=temp',
      ],
      {
        stdio: 'inherit',
      }
    )
  }
  
  return null
}

// main thread
process.on('uncaughtException', function (err) {
  console.log(err);
})
main()