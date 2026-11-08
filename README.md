# Operation Root Hog

The family app for the 2026 Thanksgiving hunt through Arco and Moore.

## What's here

| Path | What it is |
| --- | --- |
| `app/` | The web app. This whole folder is what gets hosted. |
| `app/js/content.js` | Every story line, riddle, history card, clue and Junior Agent puzzle. Edit this after scouting. |
| `app/js/config.js` | Supabase keys and game settings. |
| `supabase/schema.sql` | Tables and server functions. Run once in Supabase. |
| `supabase/seed.sql` | The answers, generated from the answer key. Run after the schema. |
| `tools/answers.json` | The private answer key. Never upload it. |
| `tools/build_answers.py` | Turns the answer key into `seed.sql` and the app's answer hashes. |

## Try it now (demo mode)

With the Supabase keys blank in `config.js`, the app runs entirely on one phone or browser with no server.
`tools/test_flow.py` forces demo mode on its own. To click through by hand, blank the keys and serve `app/`:

```
cd app
python3 -m http.server 8000
```

then visit http://localhost:8000. Settings has demo tools: show answers, send a test transmission, reset.

## After scouting

1. Fix wording and clues in `app/js/content.js` (lines marked SCOUT).
2. Fix answers in `tools/answers.json`.
3. Run `python3 tools/build_answers.py`. It rewrites the app's answer hashes and `supabase/seed.sql`.
4. Run the new `seed.sql` in the Supabase SQL editor.

## Set up the real game (free)

1. Supabase: run `supabase/schema.sql`, then `supabase/seed.sql`, in the SQL editor (already done for the live project).
2. Put the Project URL and publishable key in `app/js/config.js` (already done).
3. Hosting: push this repo to a public GitHub repository and set Settings > Pages > Source to GitHub Actions.
   The workflow in `.github/workflows/pages.yml` publishes `app/` on every push to main.
   `.gitignore` keeps the plaintext answer files out of the repo; keep them on your computer.
4. Set `demoTools: false` in `config.js` before game day.
5. Free Supabase projects pause after a week with no activity. Open the app the day before the game.

## Game master console

`gm.html` (for example https://justinr22301.github.io/operation-root-hog/gm.html) shows every family's progress,
padlock code and last location on a map, writes Family Relay clues, sends transmissions and throws the master switch.
Add `?mock` to try it with made-up families (needs `demoTools: true`).

One-time setup in Supabase:
1. Re-run `supabase/schema.sql` in the SQL editor (it adds the console's functions and is safe to re-run).
2. Authentication > Users > Add user: your email and a password, with Auto Confirm on.
3. In the SQL editor: `insert into gm_allowlist (email) values ('your email in lowercase');`
4. Optional: Authentication > Sign In / Providers > turn off "Allow new users to sign up". Nobody else needs an account.

## Game master tools in the SQL editor

```sql
-- Everyone's progress, scores, padlock codes and last location
select * from gm_overview;

-- Write a family's clue after sign-ups close (their phones get it right away)
select set_family_clue('ABC123', 'Two agents in your car joined forces in the year you need. Add the number of junior agents riding along.', '2014');

-- Live message to everyone, or to one family
select send_broadcast('Your ambassador wouldn''t stop talking about gratitude, so we took him to the substation. Bring every code you''ve got.', 'The Bad Guys', 'badguys');
select send_broadcast('Try the courthouse next. It''s close.', 'Operator Arco', 'operator', 'ABC123');

-- End the game on every phone
select throw_master_switch();

-- After the game: delete locations and sign-up answers
select end_of_game_cleanup();
```


## Recorded audio

Leave `audio` as `null` and the app reads text aloud with the phone's voice. To use recordings, put
mp3 files in `app/audio/` and set the `audio` field in `content.js`, for example `audio: "audio/hijack.mp3"`.

## When you change files after phones have loaded the game

Phones check for a newer copy every time they have signal, so a re-upload shows up on the next load.
