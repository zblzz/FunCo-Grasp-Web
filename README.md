# FunCo-Grasp

**Function beyond Form: Functional Correspondence for Cross-Embodiment Dexterous Grasp Generation**

Public project website for FunCo-Grasp.

## Overview

FunCo-Grasp establishes functional correspondences across heterogeneous hands through shared functional parts and canonical local frames. Conditioned on the hand representation and object geometry, a diffusion model generates the target spatial arrangement of the functional parts, which is converted into executable joint configurations via inverse kinematics.

Adaptation to a new embodiment uses its geometry, kinematic model, and a one-time lightweight manual functional annotation. It does not require target-hand grasp demonstrations, fine-tuning, or learned retargeting.

## Materials

This repository contains the static project website, manuscript figures, the main experimental table, and an interactive gallery of 600 selected successful grasps. The page presents the abstract, pipeline overview, simulation results, and real-world video slots.

The page entry is `index.html`, with images in `assets/` and independently managed grasp selections in `grasps/`. `site.config.json` centralizes author information, optional author homepage links, figure paths, paper/video paths, the implementation repository link, and gallery display settings. `site.content.json` contains manuscript-derived text and table data. See `grasps/README.md` for the selection and pose format. Serve this directory using a static HTTP server; viewer dependencies are self-hosted. Configuration changes must be incorporated by the local maintenance build before publication.

The simulated grasp visualization uses a shared object selector and ten grasp-index buttons for both rows: seen embodiments (Allegro, Barrett, ShadowHand) and unseen embodiments (ApexHand, LEAP, Robotiq-3F). Each hand has its own selected trial at each index; matching indices do not imply identical grasps across embodiments. Drag a model to rotate it, or scroll to zoom. On narrow screens, swipe each row to see the other embodiments.

## Availability

- This is a website repository, not an implementation release. Training and inference code are not included.
- The project video and both real-world experiment videos are included. The [paper is available on arXiv](https://arxiv.org/abs/2609.39006), including its PDF and version history. The [algorithm repository](https://github.com/zblzz/FunCo-Grasp) is separate from this website repository.
- The submitted paper and accompanying submission materials remain the primary record of the method and experiments.
