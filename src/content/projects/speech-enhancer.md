---
slug: speech-enhancer
title: Real-time Speech Enhancer
summary: A C++ speech enhancer that uses a PyTorch-trained ONNX model to reduce background noise in live and recorded audio.
---

I built a real-time speech enhancer for microphone input, Windows playback, and audio files. I trained the denoiser in PyTorch, exported it to ONNX, and integrated it into a native C++ application.

I trained the model on LibriSpeech speech mixed with MS-SNSD background noise. At runtime, it processes mono 16 kHz audio in causal STFT frames and uses a GRU-based network to predict a complex mask for the noisy spectrum. The inference pipeline carries the GRU state between frames and reconstructs the enhanced waveform.

I evaluated the model on test mixtures using scale-invariant signal-to-distortion ratio (SI-SDR), which compares enhanced speech with a clean reference; higher scores mean less distortion. Scores are measured in decibels (dB). The mean rose from 5.31 dB on noisy audio to 11.68 dB after enhancement, an average gain of 6.37 dB.

Built with C++, Python, PyTorch, and ONNX.

[View the source on GitHub](https://github.com/SupremeDonut/speech-enhancer)
