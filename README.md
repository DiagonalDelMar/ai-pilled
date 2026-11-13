# AI-Pilled

A swipe-style course that teaches AI from scratch to a non-technical compliance and investigations lawyer. It has 24 levels and 362 cards (about 3 hours), with quizzes, match and order mini-games, XP, ranks, streaks, stars, and a "two lines" checkpoint at the end of each level. It works offline once installed.

## Run locally
```bash
python3 -m http.server 4173
```
Then open http://localhost:4173.

## Put it on her iPhone
The phone needs an HTTPS link, so deploy the folder to any static host. All paths are relative, so a subfolder works too.
- GitHub Pages: push the folder to a repo, then Settings → Pages → deploy from `main` / root.
- Vercel or Netlify: drag and drop the folder.

On the iPhone: open the link in **Safari** → Share → **Add to Home Screen**.

## Edit the course
Content lives in `content.js` and `content-a.js`, `content-b.js`, `content-c.js`; `content-order.js` sets the level order. Card types: `idea`, `flow`, `quiz` (`a` = index of the correct option; options are shuffled on screen), `match`, `order` (list the items in the correct order; they are shuffled on screen), `checkpoint`.
When you deploy changes, bump `VERSION` in `sw.js` so installed phones pick up the new content.

Progress is stored only on the device (localStorage). There are no accounts and no tracking.
