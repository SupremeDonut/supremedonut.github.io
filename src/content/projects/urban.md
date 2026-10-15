---
slug: wind-sim
title: City Wind Simulator
summary: An interactive urban wind simulator with GPU fluid dynamics, a learned surrogate, and 3D city visualization.
---

![Wind Demo](/media/wind.gif)

I built this project to explore how wind moves through city neighborhoods, including Chicago, Manhattan, Tokyo, Paris, and Shanghai, with building geometry derived from Overture Maps.

I paired a Fourier Neural Operator (FNO) surrogate, which predicts wind velocity fields for interactive exploration, with a CUDA-accelerated Lattice Boltzmann Method (LBM) solver for higher-fidelity runs. I connected both through a FastAPI backend and built a React and Three.js frontend to display 3D wind streamlines and pedestrian-level comfort maps.

Built with CUDA C++, Python, PyTorch, FastAPI, React, and Three.js.

[View the source on GitHub](https://github.com/SupremeDonut/city-wind-simulator)
