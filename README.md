# FIRA-Grasp

**Functional Interaction Representation Alignment for Cross-Embodiment Dexterous Grasp Generation**

Anonymous project materials for ICRA 2027 review.

## Overview

FIRA-Grasp aligns functional hand regions and their local interaction frames across robotic embodiments. A node–edge diffusion model generates Functional Node Poses, which are converted into joint configurations using fixed inverse kinematics.

Adaptation to a new embodiment uses its geometry, kinematic model, and a one-time lightweight manual functional annotation. It does not require target-hand grasp demonstrations, fine-tuning, or learned retargeting.

## Materials

This repository contains the static project website, manuscript figures, the main experimental table, and an interactive gallery of 600 selected successful grasps. The page presents the abstract, pipeline overview, simulation results, and real-world video slots.

The page entry is `index.html`, with images in `assets/` and independently managed grasp selections in `grasps/`. See `grasps/README.md` for the selection and pose format. `media.json` specifies optional project and real-world MP4 files. To view the files locally, serve this directory using a static HTTP server. No dependency installation or build step is required for the checked-in website; its viewer dependencies are self-hosted.

The simulated grasp visualization uses a shared object selector and ten grasp-index buttons for both rows: seen embodiments (Allegro, Barrett, ShadowHand) and unseen embodiments (ApexHand, LEAP, Robotiq-3F). Each hand has its own selected trial at each index; matching indices do not imply identical grasps across embodiments. Drag a model to rotate it, or scroll to zoom. On narrow screens, swipe each row to see the other embodiments.

## Availability

- This is a website repository, not an implementation release. Training and inference code are not included.
- The project video, real-world videos, and manuscript PDF have not yet been added. Video slots are explicitly labeled as pending.
- The submitted paper and accompanying submission materials remain the primary record of the method and experiments.
