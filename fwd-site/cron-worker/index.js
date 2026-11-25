// Runs on the timer in wrangler.toml. All the real work happens in the
// website (server/portal/daily.ts); this only knocks on its door.
export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      (async () => {
        const res = await fetch(`${env.SITE}/api/portal/cron`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
        });
        console.log('Daily check', res.status, (await res.text()).slice(0, 300));
      })(),
    );
  },
};
