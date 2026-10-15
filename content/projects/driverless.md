---
slug: driverless
title: Driverless
summary: Autonomous pipeline for FSAE Driverless.
---

Wrote a ROS 2 node for Simultaneous Localization and Mapping (SLAM), reducing cone position error by over 60%.

![SLAM](/media/slam.gif)
*Visualized: the ground truth map, what a simulated perception would see, and the reconstructed map*

The cone SLAM node fuses wheel/INS odometry with cone detections to estimate the car’s pose and build a map of cone landmarks. It interpolates the odometry pose at each detection timestamp, then associates detections with existing landmarks using their geometry and measurement uncertainty. It adds keyframes as the car moves or turns and incrementally optimizes poses and landmarks with GTSAM’s iSAM2 factor graph, using bearing-and-range observations.

![Lane finding](/media/lanes.png)

I also developed a lane finding algorithm in C++ to take the map cones and output a driveable lane between them, running in <10ms on an NVIDIA Jetson.
This algorithm works by performing Delaunay triangulation to supply edges between the cones, constructing a graph
out of the midpoints of the edges, then performing a tree search over that graph to find the best path, respecting
geometric constraints while also not greedily going down a potential wrong path. This search outputs multiple plausible lanes,
where some may cut across a tight corner, or skip sections of the track entirely. A learned ranker then takes these lanes and outputs
the most likely of those to be the correct lane given the cones as context.
The centerline and calculated track bounds are then given to a model predictive controller to which then optimizes the path and translates it into steering commands.

This project turned out to be much harder than I initially expected. Since this would eventually run on a real racecar, the algorithm
had to be as robust as possible. Perception systems often give false positives or miss cones entirely, or the cones may just be set up poorly, and
I had to account for all of those different factors. Our perception also did not detect cone colors, so I was also missing a crucial signal that helped distinguish where cones belonged on the track. Setting up a good evaluation system was crucial in me being confident that I could deliver something
which wouldn't immediately fail when something unexpected happens.