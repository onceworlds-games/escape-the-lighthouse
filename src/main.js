import './style.css';

const params = new URLSearchParams(location.search);
let poster = params.get('poster');
let ui = null;
if (poster && poster.startsWith('ui-')) {
  // a staged look at the real game with its interface: ui-room_1-wall_2-lock_chest (store/shot tooling)
  ui = new URLSearchParams();
  ui.set('debug', '1');
  ui.set('still', '1');
  for (const kv of poster.slice(3).split('-')) {
    const [k, v] = kv.split('_');
    ui.set(k, v === undefined ? '1' : v);
  }
  poster = null;
}

async function boot() {
  if (poster) {
    const { runPoster } = await import('./poster.js');
    await runPoster(poster);
    return;
  }
  const { Game } = await import('./game.js');
  const game = new Game({ ow: window.onceworlds || null, canvas: document.getElementById('gl'), root: document.getElementById('ui'), debug: ui || params });
  window.__game = params.has('debug') || ui ? game : undefined;
  await game.start();
  if (ui || params.has('debug')) setTimeout(() => (document.body.dataset.ready = '1'), 2500);
}

boot().catch((e) => {
  console.error('[escape-the-lighthouse] failed to start', e);
});
