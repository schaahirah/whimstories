# whimstories

Cute IG story collages with filters, made in your browser (˶ᵔ ᵕ ᵔ˶)

**Live site:** https://schaahirah.github.io/whimstories/

![Screenshot](screenshot.png)
<!-- Tip: make a story, save it as screenshot.png and upload it to the repo -->

---

## Features

| Feature | What it does |
|---|---|
| Tabs + live preview | The story stays on screen while you switch between photos, layout, filter, colours, background, text and stickers |
| 6 layouts | Grid, Strips, Fridge, Scrapbook, Spotlight, Love Letter |
| Photo counter | Shows how many photos the layout uses (e.g. 4/6) and fades extra photos |
| 9 filters | Original, B&W, Noir, Vintage, Film, Y2K, Dreamy, Golden, Cool |
| 6 colour themes | Bubblegum, Butter, Matcha, Lilac, Baby Blue, Cherry |
| 9 backgrounds | Default, polka dots, gingham, stripes, grid, hearts, checkerboard, sparkle, or your own photo |
| Sticker pack | Tap a sticker to add it, drag to move, resize and rotate |
| Story size | Exports a 1080 × 1920 PNG, the exact Instagram Story size |
| Share button | Opens the phone share menu so you can post straight to IG |
| Feedback letter | A little letter that folds into an envelope and flies away when sent |
| Pixel background | Floating pixel fish, yarn and flowers, plus a walking cat (can be turned off) |
| Private | Photos are edited on your device and never uploaded |

---

## Add your own stickers

1. Put your PNG stickers (transparent background, about 500–800 px) in the `stickers` folder
2. Open `stickers/pack.js` and add each file name to the list:
   ```js
   window.STICKER_PACK = [
     "bow.png",
     "my-new-sticker.png",
   ];
   ```
3. Commit. The stickers appear on the site for everyone.

To remove a sticker, delete its name from the list (and the file, if you like).

---

## Set up the feedback letter

Open `script.js` and edit `CONFIG` at the top. Pick one:

**Option A: GitHub Issues (already set)**
- `githubRepo: "schaahirah/whimstories"`
- Sending opens a pre-filled issue in this repo. The person needs a GitHub account.

**Option B: Formspree (feedback goes to your email, no account needed to send)**
1. Sign up free at [formspree.io](https://formspree.io) and create a form
2. Copy your form URL, e.g. `https://formspree.io/f/abcdwxyz`
3. Set `feedbackEndpoint: "https://formspree.io/f/abcdwxyz"`

Feedback is the only thing ever sent, and only when the user taps "seal & send". Photos are never sent.

---

## Project structure

```
whimstories/
├── index.html        # Page layout
├── style.css         # Design, tabs, letter, animations
├── script.js         # Layouts, filters, stickers, export, feedback
├── bg-anim.js        # Floating pixel background + walking cat
├── stickers/
│   ├── pack.js       # List of stickers to show
│   └── *.png         # The sticker images
├── README.md
└── LICENSE
```

## Built with

- HTML, CSS, JavaScript (no framework, no libraries)
- HTML Canvas for drawing the story and applying filters pixel by pixel
- Google Fonts: Bodoni Moda, Jost, Space Mono (site); Playfair Display, Caveat, Inter, Space Mono (stories)

---

## Future ideas

- [ ] Live camera photobooth mode with countdown
- [ ] More layouts (Raya, birthday, graduation)
- [ ] Bahasa Melayu language option

## License

MIT. Free to use and modify.

© 2026 schaahirah
