const { chromium } = require('playwright');
//

const tweetUrl = process.argv[2] ||
  'https://twitter.com/johntrooper89/status/1396768837006024713';

process.stdout.write('Initial..');
(async () => {
  // const browser = await chromium.launch({
  //   headless: false
  // });
  // const context = await browser.newContext();
  const context = await chromium.launchPersistentContext(__dirname + '/data', {
    // headless: false
  });

  console.log('.');
  const page = await context.newPage();
  page.setDefaultTimeout(90 * 1000);
  page.setDefaultNavigationTimeout(90 * 1000);
  
/*
  await new Promise(async resolve => {
     await page.goto('https://twitter.com/');
     const readline = require('readline');

     const rl = readline.createInterface({
       input: process.stdin,
       output: process.stdout
     });
     rl.question('Press Enter in this terminal when logged in: ', result => resolve());
  });
*/

  for (let i = 0; i < 600; i++) {

    console.log(i + ': get likes...');


    //  THIS  IS  THE  URL  TO  "LIKES"  FOR  A  TWEET:

    await page.goto(tweetUrl + '/likes');

    process.stdout.write('   go for the top user');
    await page.waitForSelector('div[aria-modal=true]');
    process.stdout.write('.');
    const emptyListPromise = page.waitForSelector('div[data-testid=emptyState]');
    process.stdout.write('.');
    const firstUserPromise = page.waitForSelector('div[role=dialog] [data-testid=UserCell] a[role=link] span');
    process.stdout.write('.');

    const el = await new Promise(resolve => {
      emptyListPromise.then(() => resolve(), error => {});
      firstUserPromise.then(el => resolve(el), error => {});
    });

    if (!el) {
      console.log('. EMPTY LIST!');
      break;
    }

    const text = await el.textContent();
    process.stdout.write(' ' + text + '..');
    await el.click();

    console.log('.');
    // Click [data-testid="userActions"]
    await page.click('[data-testid="userActions"]');

    console.log('   block...');
    // Click [data-testid="block"]
    await page.click('[data-testid="block"]');

    console.log('   confirm...')
    // Click [data-testid="confirmationSheetConfirm"]
    await page.click('[data-testid="confirmationSheetConfirm"]');

    console.log('   ');
    await new Promise(resolve => setTimeout(resolve, 400));
  }

  // ---------------------
  await context.close();
  // await browser.close();


})();