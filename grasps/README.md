# Interactive grasp gallery

The gallery contains 10 selected successful grasps for each of 10 held-out objects and six robotic embodiments (600 selections in total). These are qualitative examples, not a new success-rate evaluation.

## Files

- `selection.json` records the selected repeat and original sample number for each embodiment–object pair, in display order.
- `catalog.json` lists the embodiments, objects, geometry files, and pose files used by the webpage.
- `geometry/` contains shared GLB visual meshes. Geometry is reused across grasp selections.
- `poses/` contains the link transforms of the selected grasps. Coordinates are right-handed, Z-up, and in metres. Matrices are stored in row-major order.
- `previews/` contains browser-rendered images of the default Apple grasp, plus a content manifest. They are temporary loading previews, not substitutes for interactive models.
- `payloads/` contains generated, losslessly compressed copies of the GLB and pose files for the anonymous host's sandbox. These are transport files, not additional experiments. Keep them in the published repository; edit the originals and rebuild instead of editing these generated files.

The poses use the saved Isaac joint configurations and the same CPU forward kinematics and visual meshes as the evaluation viewer. Both the saved result and trial CSV mark each selected sample as successful. The initial selection takes ten evenly spaced successes from repeat 0 in sample order; no new grasps are generated.

The webpage shares object and selection-index controls across both embodiment rows. Each index selects that position in each hand's own list, not a matched trial or an identical grasp across hands. Desktop shows all six embodiments; narrow screens allow horizontal swiping within each row.

## Changing selections

For the existing exported poses, edit `gallery` in `site.config.json`: `defaultObject` sets the opening object, `defaultGrasp` sets the opening displayed position (starting at 1), and `poseOrder` reorders or subsets the ten exported poses. For example, `[3,1,2,4,5,6,7,8,9,10]` displays the third saved pose first. `poseOverrides` can specify a different order for a particular hand and object; all overrides must have the same number of entries as `poseOrder`. The `hands` and `objects` lists control the visible selections and their order. Rebuild after editing. These display settings never rewrite the experiment data.

To select a trial that is not among the ten exported poses:

Edit the `repeat` and `sample` entries for the desired embodiment and object in `selection.json`, then regenerate the corresponding pose exports from the saved evaluation results. Changing this list alone does not create new pose data. Keep ten distinct successful trials per group. The export check rejects failed or missing trials and verifies that the displayed poses match the selection list.

Geometry remains in the viewer's original coordinate frame. Camera orbiting changes only the view, not the saved grasp.

The published HTML embeds the catalog and the first default pose directly from these files. Rebuild after changing exported data or media configuration so the embedded data and per-file content versions stay in sync. If the default pose or its geometry changes, the build disables its old preview until a matching preview is regenerated. The original selections and pose exports remain independently editable.

The viewer uses self-hosted classic scripts and the browser's native gzip decompression. It does not require the anonymous host to allow cross-origin module imports or data requests. Use a current browser with WebGL support. A failed resource displays a retry control; the static previews are labeled as previews while loading.
