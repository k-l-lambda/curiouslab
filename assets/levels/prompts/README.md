# Exact generation prompts

The text actually sent to the generators for the files in the parent directory,
one per asset. `../prompts.md` is the human-facing brief and explains *why* each
scene is the way it is; these are the literal inputs, kept so an asset can be
regenerated or adjusted without reconstructing its prompt from prose.

Regenerate with the tools in `tools/`:

```bash
tools/genimage.py assets/levels/prompts/l1-cover.txt assets/levels/l1-cover.png --quality high
tools/genvideo.py assets/levels/prompts/l2-clear.txt assets/levels/l2-clear.mp4 --ratio 1:1 --resolution 720p
```

Both are non-deterministic, so a regeneration will not reproduce the current file
byte for byte, and colour accuracy varies between runs. Verify what comes back
rather than assuming; see the `create-image` and `create-video` skills.
