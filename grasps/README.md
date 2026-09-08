# Interactive grasp gallery

The gallery contains 10 selected successful grasps for each of 10 held-out objects and six robotic embodiments (600 selections in total). These are qualitative examples, not a new success-rate evaluation.

## Files

- `selection.json` records the selected repeat and original sample number for each embodiment–object pair, in display order.
- `catalog.json` lists the embodiments, objects, geometry files, and pose files used by the webpage.
- `geometry/` contains shared GLB visual meshes. Geometry is reused across grasp selections.
- `poses/` contains the link transforms of the selected grasps. Coordinates are right-handed, Z-up, and in metres. Matrices are stored in row-major order.

The poses use the saved Isaac joint configurations and the same CPU forward kinematics and visual meshes as the evaluation viewer. Both the saved result and trial CSV mark each selected sample as successful. The initial selection takes ten evenly spaced successes from repeat 0 in sample order; no new grasps are generated.

The webpage shares object and selection-index controls across both embodiment rows. Each index selects that position in each hand's own list, not a matched trial or an identical grasp across hands. Desktop shows all six embodiments; narrow screens allow horizontal swiping within each row.

## Changing selections

Edit the `repeat` and `sample` entries for the desired embodiment and object in `selection.json`, then regenerate the corresponding pose exports from the saved evaluation results. Changing this list alone does not create new pose data. Keep ten distinct successful trials per group. The export check rejects failed or missing trials and verifies that the displayed poses match the selection list.

Geometry remains in the viewer's original coordinate frame. Camera orbiting changes only the view, not the saved grasp.
