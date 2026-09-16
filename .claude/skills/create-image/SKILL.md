---
name: create-image
description: Generate images with the gpt-image-2 endpoint via tools/genimage.py. Use when asked to produce, generate, or regenerate artwork, covers, sprites, illustrations or any raster image asset.
---

# Generating images

One endpoint is available: `POST $CLAUDE_BASE_URL/v3/gpt-image-2-text-to-image`,
authenticated with `Authorization: Bearer $PAIGOD_API_KEY`. Both come from the
environment; never hardcode the host or the key.

Call it through the wrapper rather than by hand:

```bash
tools/genimage.py PROMPT_FILE OUT.png [--quality low|medium|high] [--size WxH] [--n 1-10]
```

The prompt goes in a **file**, not on the command line. Prompts for real artwork
run to several hundred words and carry exact hex values, quotes and backticks; a
shell mangles those, and a mangled prompt still returns a perfectly nice picture
of the wrong thing, so the damage is silent.

```bash
tools/genimage.py assets/levels/l1-cover.txt assets/levels/l1-cover.png --quality high
tools/genimage.py brief.txt draft.png --quality low --n 4   # draft-1..4.png
echo "a red ball" | tools/genimage.py - ball.png --quality low
```

## Parameters

| Parameter | Values | Notes |
|---|---|---|
| `prompt` | up to 32000 chars, Chinese or English | required |
| `size` | `1024x1024`, `1024x1536`, `1536x1024`, `2048x2048`, `2048x1152`, `3840x2160`, `2160x3840`, `2048x1360`, `1360x2048`, `1152x2048`, `2048x1536`, `1536x2048`, `2048x880`, `880x2048`, `688x2048`, `2048x688`, `2048x1024`, `1024x2048`, `auto` | default `1024x1024` |
| `quality` | `low`, `medium`, `high` | default `medium`; the tool defaults to `high` |
| `output_format` | `png`, `jpeg` | default `png` |
| `background` | `opaque`, `auto` | **no transparency exists**, see below |
| `n` | 1–10 | one call, several variants; may return fewer |
| `moderation` | `low`, `auto` | default `auto` |
| `output_compression` | 0–100 | jpeg only; png must be 100 or unset |

Measured timings at `1024x1024`: `low` ~18–22s, `medium` ~35–50s, `high` ~2m20s.
`n` does not scale the wait linearly — three `low` images came back in 22s, about
the same as one — so asking for several variants at once is close to free.

`high` exceeds a 120s foreground command timeout. Run it in the background and
wait on the output file appearing rather than blocking on the call.

## What this endpoint cannot do

- **No image-to-image and no start frame.** Only the text-to-image contract is
  live. Every other model name under `/v3/` — including a deliberately bogus one
  — returns the same `unsupported native endpoint contract` error, so this is the
  whole surface, not a naming problem. Any plan that needs "continue from this
  image" needs a different service.
- **No transparent background.** `background` accepts only `opaque` and `auto`;
  neither yields an alpha channel. Output is RGB. Anything needing cut-out layers
  must be composited another way.

## Two traps that cost real time

**The success signal is `images`, not `base_resp`.** Two response shapes come
back. One carries `base_resp: {status_code: 0, status_msg: "success"}` and
nothing else; the other omits `base_resp` entirely and echoes the parameters it
used. Code that keys success on `base_resp.status_code == 0` reports a perfectly
good image as a failure. The wrapper already handles this.

**The response is a signed URL, not image bytes.** It is time-limited, so it
must be downloaded immediately; there is no point recording it for later. The
wrapper does the download as a second step.

A 400 is worth reading rather than guessing past: validation errors quote the
entire request schema back, including enums and defaults. `-d '{}'` is the
cheapest way to get authoritative parameter documentation.

## Getting the colours you asked for

Named hex values **drift, and emphasis moves them without pinning them**. Treat
the hex as a strong hint, never as a guarantee.

Asking for a fish body at `#5cc3e8` first returned `#7cc4e4` — right hue, washed
out. Re-prompting the same value with emphasis landed it exactly, at `high`:

- write the value as `exactly #5cc3e8`
- add the negative form: `fully saturated, not pale, not washed out, not white-tinted`
- say why, in one clause: `must match sprite characters that already use these precise colours`

But the same emphasis **overshoots** as readily as plain wording undershoots. A
banana briefed at `#f7d84a` with that exact phrasing came back `#fcd424` at
`low`: red and green almost exact, blue 38 off, pushed past the target because
"fully saturated, not pale" is a direction rather than a stopping point. A second
colour in the same prompt (`#e0b92c`) landed within 2 per channel at the same
time, so accuracy varies *within* one image, not just between renders.

What follows for colour-critical work:

- measure every briefed colour separately; one being exact says nothing about the next
- generate several variants at `low` and compare before paying for a `high` render
  — variants from a single `--n` call differed by 1 vs 9 per channel on the same value
- expect to iterate on wording, and accept a near miss in the right hue family
  rather than chasing an exact match that the endpoint may not hit

## Verify what came back — you cannot look at it

**`Read` on an image returns `.` in this environment.** There is no way to see
the result, so every claim about it has to be measured. Use PIL and numpy, which
are installed (scipy too). There is no OCR and no sudo, so text in an image
cannot be detected — never claim an image is free of text or that a character
resembles a reference; report those as needing human eyes.

Worth measuring, and enough to catch real failures:

- **size and mode** — `Image.open(p).size`, `.mode`
- **flat-vector style** — count colour buckets with `(px // 16)`; flat art lands
  in the hundreds, a photo or glossy render in the thousands
- **palette presence** — fraction of pixels within ~30 per channel of each
  briefed hex
- **figure count** — `scipy.ndimage.label` on a colour-family mask, after
  `binary_closing` to rejoin a figure split by its own outline. Filter blobs by
  fill ratio (area ÷ bounding box): a drawn figure fills roughly two thirds, a
  painted line or edge a few percent. This is the check that catches art
  contradicting its purpose, such as a counting cover showing the wrong number
  of objects.
- **crop safety** — if the image will be cropped to a circle, locate the figure
  as a blob and confirm it sits inside the inscribed circle. Do not test for
  uniform corners; a full scene is supposed to have scenery there.

**Prove a check fires before trusting its silence.** Build a deliberately wrong
image and confirm the check fails on it. Checks written against these covers were
wrong three times in ways that only a control exposed: one tested for quiet
corners the brief never asked for; one used a pale marker colour that matched 85%
of the sky, so it measured background instead of subject; and a repaired version
went silent because it examined only the largest blob. A check that passes
everything looks exactly like a clean result.

When measuring a figure's colour, sample only the mask pixels. Averaging a
bounding box mixes in outline and background and reports a shade that appears
nowhere in the image.
