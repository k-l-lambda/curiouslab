---
name: create-video
description: Generate video clips with the Dreamina Seedance endpoint via tools/genvideo.py. Use when asked to produce, generate or regenerate video, animation, motion or a clip.
---

# Generating video

Asynchronous, in two calls:

```
POST $CLAUDE_BASE_URL/v3/bytedance/metered/contents/generations/tasks      -> {"id": "cgt-..."}
GET  $CLAUDE_BASE_URL/v3/bytedance/metered/contents/generations/tasks/ID   -> {"status": ...}
```

Authenticated with `Authorization: Bearer $PAIGOD_API_KEY`. Both host and key
come from the environment; never hardcode either.

Use the wrapper, which creates and then polls:

```bash
tools/genvideo.py PROMPT_FILE OUT.mp4 [--duration 5] [--ratio 1:1] [--resolution 720p]
tools/genvideo.py --task cgt-20260916111803-bwo2f OUT.mp4   # resume or refetch
```

## A task cannot be undone

**There is no cancel.** `DELETE` on a task and `POST .../{id}/cancel` both return
`unsupported native endpoint contract`. Create and poll are the entire surface,
so every created task runs to completion and bills.

**Values are validated by starting work, not before it.** An invalid `--ratio`
is refused for free, but a valid one begins a real generation. Sweeping an enum
to discover what it accepts therefore costs one video per value — this was
learned by doing it, and it created eleven unwanted clips that could not be
stopped. The accepted values are recorded below so nobody needs to repeat that.
`tools/genvideo.py` checks them locally before it calls out.

Generation takes **several minutes**, far longer than an image. Poll on an
interval; do not block a foreground command on it.

## Model and parameters

Only `dreamina-seedance-2-5-260628` works. `seedance-2.0` appears in
`GET /v1/models` but returns `InvalidEndpointOrModel.NotFound`. Requests resolve
internally to `eva-video-2.5-t2v-480p-720p`, which is text-to-video only.

Parameters arrive **two different ways**, which is the easiest thing to get wrong:

| Parameter | Where it goes | Values |
|---|---|---|
| prompt | `content: [{type: 'text', text: ...}]` | required; a bare `prompt` field is rejected |
| `--ratio` | appended to the prompt text | `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `21:9`, `adaptive` |
| `--resolution` | appended to the prompt text | `480p`, `720p`, `1080p` (`2k` and `4k` rejected) |
| `duration` | top-level JSON field | `-1`, or `4`–`30` seconds |
| `generate_audio` | top-level JSON field | **defaults to `true`** |

`content` must be a list of typed parts. Sending `{"prompt": "..."}` fails with
`expr_path=content, cause=missing required parameter`.

**`generate_audio` defaults on.** For a silent project this is wrong by default
and has to be turned off explicitly; `tools/genvideo.py` defaults it off and
takes `--audio` to enable it. A clip generated without the flag came back
carrying a real AAC stereo track at 32 kHz, so this is not a nominal setting.

**Measured defaults**, from a request that specified neither ratio nor duration:
`1280x720` (16:9), 5.04s, 24fps, h264 in MP4, about 2.2 MB. So the default aspect
is landscape — a square clip needs `--ratio 1:1` explicitly.

The finished video arrives at **`content.video_url`** in the task payload, as a
time-signed TOS link (`X-Tos-Expires=86400`). It has to be downloaded; there is
no inline data.

An empty `{}` body returns `unsupported native endpoint contract`, which looks
exactly like a wrong URL and sent an earlier attempt hunting for a path that was
correct all along. The contract is matched against the **body**, so probe with a
minimally valid body, not an empty one.

## Writing the prompt

Give a **shot list with second ranges**, not a description. A brief without
timing comes back as one continuous drift with no beats:

```
0.0 to 1.5 seconds: <beat>
1.5 to 3.0 seconds: <turn>
3.0 to 4.5 seconds: <landing>
4.5 to 5.0 seconds: hold on <final pose>
```

State `camera completely still, no pans and no zooms` if the frame should not
move; generators drift toward camera motion otherwise. Restate any invariant as
an absolute — `exactly three fish visible in every frame from start to finish,
none enters, leaves or hides` — because a count that changes mid-clip is a
failure a viewer notices and a thumbnail does not show.

Colour behaves as it does for images: see the `create-image` skill. Hex values
drift, emphasis moves them without pinning them, and accuracy varies within a
single render.

## Verify the clip — you cannot watch it

`ffprobe`, `ffmpeg`, `cv2` and `av` are all installed. Video cannot be viewed
here any more than an image can, so measure it.

Cheap and worth doing every time:

```bash
ffprobe -v quiet -print_format json -show_format -show_streams OUT.mp4
```

That gives duration, dimensions, codec, fps, frame count, and whether an audio
stream exists — the last one catches `generate_audio` being left on.

Then check the content **per frame**. Decode with `cv2.VideoCapture`, sample
every Nth frame, and measure the colour family described in `create-image` on
each one. Scale any area floor to the frame size; these clips come back smaller
than a 1024px cover.

**Measure total area of the colour family, not the number of blobs.** Blob count
is what a still image wants, and it is wrong for video: two figures that touch or
overlap merge into one connected component, so the count collapses while nothing
has actually left the frame. On a real clip this produced a dramatic false alarm
— 14 of 25 sampled frames appeared to break a "exactly three fish" rule. Two
things were actually happening, neither a defect:

- the splash the brief asked for threw **droplets in the same colour family**,
  counted as extra figures. Sizes separated the populations cleanly: fish
  ~5000–5500px, droplets 620–1828px, no overlap between the groups.
- during the splash the fish **touched and merged**, so the count read 1 while
  the total blue area was still 1.06–1.24x its pre-splash baseline.

Total area over a size floor stayed within 0.80–1.51x baseline for the whole
clip, which is the honest statement that nothing vanished. So: use area as the
invariant, use a size floor to exclude effects like droplets, and treat a
count anomaly as **a frame range to look at**, never as a verdict. Occlusion and
absence are not distinguishable by these means, and claiming otherwise is how a
good clip gets thrown away.

**Build a control before trusting a clean result.** A synthetic clip holding
three figures for half its length and four for the rest confirmed the per-frame
check reports the frame where a count changes. A checker that reads frame 0 and
never looks again is indistinguishable from a correct clip.

What cannot be checked here: whether text appears, and whether characters
resemble a reference. No OCR is available and no sudo to install one. Report both
as needing human eyes rather than asserting them.
