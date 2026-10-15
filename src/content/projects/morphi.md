---
slug: morphi
title: Morphi
summary: An AI coach, taking a short video and providing targeted feedback to the user.
---
Built for HackIllinois 2026, top 7/226 HackVoyager finalist.

<iframe
	src="https://www.youtube-nocookie.com/embed/p8PUMUjyXiI"
	title="Morphi pitch video"
></iframe>

Morphi turns a five-second video into coaching for sports, exercise, or dance practice.
It finds mistakes in the user's motion, pauses playback at each one, overlays a corrected
pose on top of the current one, and narrates a targeted correction.
A score and session history helps users track their improvement over time.


I built the backend AI pipeline, routing the recorded video through YOLO to retrieve skeleton data,
then through our LoRA fine-tuned Qwen3-VL-32B model served across 4 H200s, returning specific actionable
feedback converted to speech with ElevenLabs TTS and corrected poses in less than 24 seconds.

[Devpost](https://devpost.com/software/morphi) [GitHub source](https://github.com/SupremeDonut/hackillinois-2026)