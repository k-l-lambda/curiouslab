# Exact generation prompts

The text actually sent to the generators for the files in the parent directory,
one per asset. `../prompts.md` is the human-facing brief and explains *why* each
scene is the way it is; these are the literal inputs, kept so an asset can be
regenerated or adjusted without reconstructing its prompt from prose.

Regenerate with the tools in `tools/`:

```bash
tools/genimage.py assets/levels/prompts/l1-cover.txt assets/levels/l1-cover.webp --quality high
tools/genvideo.py assets/levels/prompts/l2-clear.txt assets/levels/l2-clear.mp4 --ratio 1:1 --resolution 720p
```

Both are non-deterministic, so a regeneration will not reproduce the current file
byte for byte, and colour accuracy varies between runs. Verify what comes back
rather than assuming; see the `create-image` and `create-video` skills.

## `l1-clear.mp4` was regenerated, not trimmed

Worth keeping because the first attempt looked like an art problem and was not.

The original clip came back with the three fish **swimming into** an empty pool
over the first 0.75 seconds, breaking the rule in `../prompts.md` that exactly
three fish are visible from the first frame — a child who has just answered
"three" should not then watch the count assemble itself. That was patched by
cutting the opening with `ffmpeg -ss 0.75`, which cost 0.71s of a 5s clip.

Once first frames turned out to be supported, the clip was regenerated from
`l1-cover.webp` instead, and the prompt's first beat rewritten to assert the
opening state ("the three fish are already in the pool from the very first frame")
rather than leaving it to be inferred. The trim is gone; the clip is a full 5.04s
and frame zero measures 3.6 mean abs diff from the cover.

The regeneration also fixed a fault nobody had noticed. Measuring the trimmed
clip for the fish blue `#5cc3e8` found **zero** matching pixels, which reads as
"no fish at all" — the fish were there, rendered pale, closest pixel 33.7 away.
Segmented by saturation instead they measured about 4600px total; the clip
generated from the cover measures 12822px for the same three fish. Starting from
the cover pins the palette, which a text prompt on its own does not.
