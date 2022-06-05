//@ts-check

async function massBlock() {
  const dummy = {};

  const pairTweetContainerAndLikesButton = [...document.querySelectorAll('article[role=article]')].map(art => [
    art,
    [...art.querySelectorAll('a[role=link]')].filter(a => /\sLikes$/i.test(a.textContent))[0]
  ]).filter(pair => pair[0] && pair[1])[0];

  if (!pairTweetContainerAndLikesButton) return nogo('Cannot find a Tweet with Likes button on this page?');
  const [tweetContainer, likesListButton] = pairTweetContainerAndLikesButton;

  // close any open dialogs first
  {
    const dialog = document.querySelector('div[role=dialog]');
    if (dialog) {
      const dialogClose = /**@type {HTMLButtonElement} */(dialog.querySelector('div[role=button][aria-label=Close]'));
      if (dialogClose) {
        dialogClose.click();
        await waitFor(() => !document.querySelector('div[role=dialog]'));
      }
    }
  }

  likesListButton.click();

  const dialog = await waitFor(() => document.querySelector('div[role=dialog]'));
  const dialogClose = await waitFor(() => dialog.querySelector('div[role=button][aria-label=Close]'));
  await waitFor(() => /^Liked by/.test(dialog.querySelector('h2[role=heading]').textContent));
  console.log('Awaiting the likes... ', { tweetContainer, likesListButton, dialog, dialogClose });

  const timeline = await waitFor(() => [...dialog.querySelectorAll('div[aria-label]')].filter(label => /Timeline/.test(label.getAttribute('aria-label')))[0]);
  const doneFans = [];
  /** @type {Window} */
  let anotherWindow;
  while (true) {
    /** @type {HTMLElement[]} */
    const fans = await waitFor(() => timeline.querySelectorAll('div[role=button][data-testid=UserCell]'));
    let noneFound = true;
    for (let i = 0; i < fans.length; i++) {
      const fanUrl = fans[i].querySelector('a[role=link]').href;
      if (doneFans.indexOf(fanUrl) >= 0) {
        fans[i].style.background = 'gray';
        continue;
      }

      console.log((doneFans.length + 1) + ' ' + fanUrl.split('/').reverse()[0]);
      fans[i].style.transition = 'background-color 1s';
      await waitFor(1);
      fans[i].style.background = 'silver';
      doneFans.push(fanUrl);
      await blockFan(fanUrl);
      if (i>2)
        fans[i-1].scrollIntoView({behavior: 'smooth'});
      fans[i].style.background = 'gray';
      noneFound = false;
    }

    if (noneFound) break;
  }

  await waitFor(300);
  alert('All finished.');
  
  /** @param {string} fanUrl */
  async function blockFan(fanUrl) {
    const fanHandler = fanUrl.split('/').reverse()[0];
    if (anotherWindow)
      anotherWindow.location.href = fanUrl;
    else
      anotherWindow = window.open(fanUrl, '__blank');
    
    console.log('   BLOCK:' + fanHandler + ' window opened, waiting for load ', anotherWindow);

    await waitFor(() => anotherWindow.document.querySelector('h2[role=heading]'));
    await waitFor(() => [...anotherWindow.document.querySelectorAll('div[aria-label]')].filter(label => /Timeline/.test(label.getAttribute('aria-label')))[0]);
    const menu = await waitFor(() => anotherWindow.document.querySelector('div[data-testid=userActions]'));
    console.log('   BLOCK:' + fanHandler + ' open the menu...');
    menu.click();
    const blockButton = await waitFor(() => anotherWindow.document.querySelector('div[role=menu] div[role=menuitem][data-testid=block]'));
    console.log('   BLOCK:' + fanHandler + ' click block...');
    blockButton.click();
    const blockConfirmButton = await waitFor(() =>
      [...anotherWindow.document.querySelectorAll('div[data-testid=confirmationSheetDialog] div[role=button] span')]
      .filter(btn => /Block/.test(btn.textContent))[0]);
    console.log('   BLOCK:' + fanHandler + ' confirm block...');
    blockConfirmButton.click();
    await waitFor(() => [...anotherWindow.document.querySelectorAll('div[role=button]')].filter(btn => /Blocked/.test(btn.textContent)));
    console.log('   BLOCK:' + fanHandler + ' DONE.');
  }


  /** @param {string} message */
  function nogo(message) {
    alert(message);
  }

  function waitFor(predicate) {
    if (predicate > 0) return new Promise(resolve => setTimeout(resolve, predicate));

    return new Promise((resolve, reject) => {
      const start = Date.now();
      const timeoutAfter = start + 1000 * 60; // 60 seconds
      const intervalHandle = setInterval(repeat, 300);
      async function repeat() {
        let result;
        try {
          result = await predicate();
        } catch (err0r) { return; }
        if (result && (result.length || typeof result.length !== 'number')) { // if it's an array, it better not be empty!
          clearInterval(intervalHandle);
          resolve(result);
        }
        else if (Date.now() > timeoutAfter) {
          clearInterval(intervalHandle);
          reject(new Error('Timed out ' + predicate));
        }
      }
    });
  }

  /**
 * @typedef {string | {
 *  tagName?: string;
 *  parentElement?: HTMLElement;
 *  children?: (HTMLElement | CreateElementDescr)[];
 *  [index: string]: any;
 * }} CreateElementDescr
 */

  /** @param descr {CreateElementDescr} */
  function createElement(descr) {
    if (typeof descr === 'string') return document.createElement(descr);
    const el = document.createElement(descr.tagName || 'div');
    for (const k in descr) {
      if (k === 'tagName' || k === 'parentElement' || k === 'children' || k in dummy) continue;
      else if (k in el.style) el.style[k] = descr[k];
      else el[k] = descr[k];
    }

    if (descr.children) {
      for (var childDescr of descr.children) {
        if (!childDescr) continue;
        const child = typeof /** @type {HTMLElement}*/(childDescr).appendChild === 'function' ? /** @type {HTMLElement}*/(childDescr) : createElement(/** @type { CreateElementDescr}*/(childDescr));
        el.appendChild(child);
      }
    }

    if (descr.parentElement) descr.parentElement.appendChild(el);
    return el;
  }
  /**
 * @typedef {string | {
 *  tagName?: string;
 *  parentElement?: HTMLElement;
 *  children?: (HTMLElement | CreateElementDescr)[];
 * [index: string]: any;
 * }} CreateElementDescr
 */

}

massBlock();
