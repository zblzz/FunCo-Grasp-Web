# FunCo-Grasp

**Function beyond Form: Functional Correspondence for Cross-Embodiment Dexterous Grasp Generation**

Anonymous project materials for ICRA 2027 review.

## Overview

FunCo-Grasp establishes functional correspondences across heterogeneous hands through shared functional parts and canonical local frames. Conditioned on the hand representation and object geometry, a diffusion model generates the target spatial arrangement of the functional parts, which is converted into executable joint configurations via inverse kinematics.

Adaptation to a new embodiment uses its geometry, kinematic model, and a one-time lightweight manual functional annotation. It does not require target-hand grasp demonstrations, fine-tuning, or learned retargeting.

## Materials

This repository contains the static project website, manuscript figures, the main experimental table, and an interactive gallery of 600 selected successful grasps. The page presents the abstract, pipeline overview, simulation results, and real-world video slots.

The page entry is `index.html`, with images in `assets/` and independently managed grasp selections in `grasps/`. `site.config.json` centralizes figure paths, optional local paper/video paths, the anonymous repository link, and gallery display settings. `site.content.json` contains manuscript-derived text and table data. See `grasps/README.md` for the selection and pose format. To view the checked-in website, serve this directory using a static HTTP server; its viewer dependencies are self-hosted. Configuration changes need to be incorporated by the local maintenance build before publication; the browser intentionally reads the generated inline configuration rather than fetching JSON from the anonymous host.

The simulated grasp visualization uses a shared object selector and ten grasp-index buttons for both rows: seen embodiments (Allegro, Barrett, ShadowHand) and unseen embodiments (ApexHand, LEAP, Robotiq-3F). Each hand has its own selected trial at each index; matching indices do not imply identical grasps across embodiments. Drag a model to rotate it, or scroll to zoom. On narrow screens, swipe each row to see the other embodiments.

## Availability

- This is a website repository, not an implementation release. Training and inference code are not included.
- The project video, real-world videos, and manuscript PDF have not yet been added. Video slots are explicitly labeled as pending.
- The submitted paper and accompanying submission materials remain the primary record of the method and experiments.
