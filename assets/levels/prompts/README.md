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

## `l1-clear.mp4` is trimmed, not raw

This one asset is not a straight generation output. The clip came back with the
three fish **swimming into** an empty pool over the first 0.75 seconds, which
breaks the rule in `../prompts.md` that exactly three fish are visible from the
first frame — a child who has just answered "three" should not watch the count
assemble itself. Every frame after 0.75s was correct, so the opening was cut:

```bash
ffmpeg -ss 0.75 -i raw.mp4 -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -an l1-clear.mp4
```

Result: 4.29s instead of 5s, holding exactly three fish in every sampled frame.
The beat structure survives the cut — motion still peaks in the middle third
where the splash is, and the final frames still settle into a hold.

A regeneration attempt with the opening state stated as an existing condition was
**worse**, not better: it put four fish on screen for the whole clip, which is the
one failure the brief singles out as damaging. Trimming a good clip beat
re-rolling the prompt here.
