# FIRA-Grasp

**Functional Interaction Representation Alignment for Cross-Embodiment Dexterous Grasp Generation**

Anonymous project materials for ICRA 2027 review.

## Overview

FIRA-Grasp aligns functional hand regions and their local interaction frames across robotic embodiments. A node–edge diffusion model generates Functional Node Poses, which are converted into joint configurations using fixed inverse kinematics.

Adaptation to a new embodiment uses its geometry, kinematic model, and a one-time lightweight manual functional annotation. It does not require target-hand grasp demonstrations, fine-tuning, or learned retargeting.

## Materials

This repository contains the static project website and figures from the manuscript. The website presents the method, simulation results, real-world experiments, ablation studies, finger-length variations, and grasp diversity.

The page entry is `index.html`, with its images in `assets/`. To view the files locally, serve this directory using a static HTTP server. No dependency installation or build step is required for the checked-in website.

## Availability

- This is a website repository, not an implementation release. Training and inference code are not included.
- The project video and manuscript PDF have not yet been added. The opening media section currently shows labeled manuscript stills.
- The submitted paper and accompanying submission materials remain the primary record of the method and experiments.
