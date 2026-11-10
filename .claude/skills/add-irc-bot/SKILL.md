---
name: add-irc-bot
description: Add IRC chat content (new bot nicks, chatter lines, replies, join/quit/action events, or a new channel like #surabaya) to the IRC Chat app (IRC in js/data.js, behaviour in js/apps/chat.js), or new Messenger buddy replies. Use when asked to "add an IRC bot", "tambah bot", "add a channel", "add bot lines", "new chat line", "Member VIP bot line", or when turning a Kenangan Warnet memory into chat.
---

# Add an IRC bot, line or channel

The IRC Chat app (`js/apps/chat.js`) is a fake DALnet client. All of its content is the `IRC` object in `js/data.js` (later `data/irc.json`):

| Key | Meaning |
| --- | --- |
| `server` | Shown in the title bar (`irc.dal.net`). |
| `channels` | `{ '#jakarta': [nicks...], ... }`. Each key is a tab; nicks are the bots in that channel's nick list. |
| `lines` | Random chatter; any bot in any channel may say any line. |
| `replies` | Answers when the user talks; `{me}` is replaced with the user's nick. |
| `eras` | Per PC era (`2011`, `2015`): `since` (channel topic date, e.g. `Sat Jan 8 2011`), `lines` and `replies` that replace the 2003 ones on that PC. Talk about that era's games and apps (Point Blank, Plurk, BBM; Dota 2, LINE, Instagram). |
| `events` | Functions `(nick) => [cls, text]` with `cls` `'sys'` (joins/quits) or `'act'` (actions); the word `you` is replaced with the user's nick. A message containing `quit` makes the bot leave and rejoin 8 seconds later. |

Messenger has its own buddy and `REPLIES` list at the top of `js/apps/messenger.js`.

## Voice and content rules

- **Indonesian chat-speak circa 2000 to 2006**: `asl pls`, `wkwkwk`, `salken`, `aq`, `gw`, `bgt`, `pm aja`, `testi dong`, `brb`, typos welcome.
- Nicks look like real DALnet nicks: `^AnGeL^`, `r1zky^jkt`, `Kenzo\``, `anak_kos`. Max 16 characters, no spaces.
- **No real people's names, handles, phone numbers or emails.** Supporter bot lines (Member VIP tier) use the supporter's chosen display nick only, after they confirm it.
- **Nothing hateful, sexual, or that punches down** (ethnicity, religion, gender, region). Playful regional pride (`persib_mania`, `teh_ella`) is fine.
- No links in lines. No HTML: the chat escapes text, so markup would just show as text anyway.

## Steps

1. **New lines**: append strings to `IRC.lines` (chatter) or `IRC.replies` (must contain `{me}` at least once to feel personal; it is optional but preferred).
2. **New bot in an existing channel**: append the nick to that channel's array in `IRC.channels`.
3. **New channel**: add a key starting with `#` and an array of at least 6 nicks:
   ```js
   '#surabaya': ['arek_suroboyo', 'cak_kartolo', 'bonek_mania', 'ning_ayu', 'Tunjungan_kid', 'rek_ayo_rek'],
   ```
   The tab, topic and title update automatically. Keep `#jakarta` first; the app starts there and `/join` uses its nicks for unknown channels.
4. **New event**: add `(n) => ['act', \`* ${n} lagi ngantri print tugas\`]`. Use `sys` for join/quit style messages.
5. **Messenger**: append to `REPLIES` in `js/apps/messenger.js`.
6. If the line came from a memory or a supporter, mention the issue number in the commit message.

## Validation and tests

- `npm run dev`, open `http://localhost:3000/#desktop`, open IRC Chat, switch to your channel, type a message, try `/me`, `/nick`, `/join #surabaya`, `/slap`. Watch for lines appearing and nicks quitting/rejoining.
- Content validation tests must pass: channel keys start with `#`, every channel has at least one nick, nicks are at most 16 characters with no whitespace, lines and replies are non-empty strings without `<`, and there are no duplicates.
- If you changed `js/apps/chat.js` behaviour, add or update an e2e spec tagged `@app:chat` (Messenger: `@app:ym`). Make randomness deterministic in tests (stub `Math.random`) rather than waiting on timers. Each test has a `// source:` comment:
  ```js
  // source: #64 (kenangan: #surabaya channel)
  ```
- Keep coverage at 100% for `chat.js`/`messenger.js`.
- `npm run gate` passes; paste the output in the PR.
