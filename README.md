# whimstories ✿

Cute IG story collages with filters, made in your browser (˶ᵔ ᵕ ᵔ˶)

**Live demo:** https://schaahirah.github.io/whimstories/

![Screenshot](screenshot.png)

---

## Features

| Feature | What it does |
|---|---|
| 6 layouts | Grid, Strips, Fridge, Scrapbook, Spotlight, Love Letter |
| 9 filters | Original, B&W, Noir, Vintage, Film, Y2K, Dreamy, Golden, Cool |
| 6 colour themes | Bubblegum, Butter, Matcha, Lilac, Baby Blue, Cherry |
| 9 backgrounds | Default, polka dots, gingham, stripes, grid, hearts, checkerboard, sparkle, or your own photo |
| Feedback box | Users can rate the app and suggest improvements |
| Your own words | Headline, small text and captions / hashtags |
| Cute stickers | Stars, hearts, flowers, sparkles and magnet pins built in |
| Story size | Exports 1080 × 1920 PNG, the exact Instagram Story size |
| Share button | Opens the phone share menu so you can post straight to IG |
| Pixel background | Floating pixel flowers and hearts (can be turned off) |
| Private | Photos are edited on your device and never uploaded |

---

## How to use

1. Add up to 8 photos
2. Pick a template
3. Choose a filter and colours
4. Pick a background (or upload your own)
5. Type your words (optional)
6. Tap **download** or **share**

Tip: photos fill the template in order (1, 2, 3…). Use **Shuffle** or remove photos to change the order.

---

## Publish free on GitHub Pages

1. Create a new **public** repository called `whimstories`
2. Upload `index.html`, `style.css`, `script.js`, `bg-anim.js`, `README.md` and `LICENSE`
3. Go to **Settings → Pages**
4. Under **Source**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**
5. Wait about 1 minute. Your site will be live at `https://YOUR-USERNAME.github.io/whimstories/`

---

## Set up the feedback box

The feedback box can work in two ways. Open `script.js` and edit `CONFIG` at the top.

**Option A: GitHub Issues (easiest)**
1. Set `githubRepo: "your-username/whimstories"`
2. Feedback opens a pre-filled GitHub Issue in your repo
3. Note: the person needs a free GitHub account to post it

**Option B: Formspree (best for non-coders, no account needed to send)**
1. Sign up free at [formspree.io](https://formspree.io) and create a form
2. Copy your form URL, e.g. `https://formspree.io/f/abcdwxyz`
3. Set `feedbackEndpoint: "https://formspree.io/f/abcdwxyz"`
4. Feedback arrives in your email inbox

Privacy: feedback is the **only** thing ever sent, and only when the user taps "send". Photos are never sent.

---

## Project structure

```
whimstories/
├── index.html   # Page layout
├── style.css    # Bright UI design
├── script.js    # Templates, filters, stickers, export
├── bg-anim.js   # Floating pixel-art background
├── README.md
└── LICENSE
```

## Built with

- HTML, CSS, JavaScript (no framework, no libraries)
- HTML Canvas for drawing the story and applying filters pixel by pixel
- Google Fonts: Playfair Display, Caveat, Space Mono, Inter

---

## Future ideas

- [ ] Live camera photobooth mode with countdown
- [ ] Drag to move and resize photos
- [ ] Blur / dim slider for custom backgrounds
- [ ] More templates (Raya, birthday, graduation)
- [ ] Custom sticker upload
- [ ] Bahasa Melayu language option

Ideas and pull requests are welcome!

## License

MIT. Free to use and modify.
