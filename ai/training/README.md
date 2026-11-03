# Ballighni scratch fine-tuning

Select a free T4 GPU in Colab. This is a measured pilot, not a promise to detect every scratch. Only public dataset images are downloaded; personal reports, credentials and evidence are never uploaded. The current live detector stays unchanged until evaluation and manual review.

Dataset: AutoDamageIQ by Tugberk Kalay, pinned b5abbf54bdf7c8817a4e20b6ab39c8f1fe98a0e5, uploader-declared CC BY 4.0. This pilot uses its VehiDE-prefixed subset to reduce direct CarDD reuse. Original-source rights and label quality need review before production. Dataset card: https://huggingface.co/datasets/tugberkkalay/autodamageiq-vehicle-damage-dataset .

Train 800 source groups, validation 160, test 160. Exact image hashes are disjoint; VehiDE source-image identifiers are separated. No vehicle-level metadata is available, so independent-vehicle separation and prior pretraining overlap cannot be guaranteed. Dataset labels are remapped to the existing model's six classes. Train at 1024 pixels for up to 12 epochs with early stopping; report scratch precision, recall, AP50 and AP50-95 plus all-class AP. The validation gate and one final held-out test comparison never automatically deploy a checkpoint.

The dataset includes automatically generated labels. Tiny scratches and intact reflective panels need additional human annotation and a representative independent benchmark. A better metric on this subset is not proof of better real-world performance.

## Current Colab run
Notebook: https://colab.research.google.com/drive/1Y6wMefuJtT_kA7pLP7nBw_BZTtWmnB7I

3 November 2026: a free Tesla T4 was allocated. The first preparation check correctly refused a mistaken date-only grouping rule. The corrected source-image grouping is in the script and notebook. Dataset preparation completed (800 train / 160 validation / 160 test). The corrected candidate is training on the T4; training/evaluation results are not yet available. Missing-label images are excluded. Class names match the original model exactly to avoid resetting unrelated class heads. The app has NOT been updated with newly trained weights.

## Image detail
New backend uploads retain up to 3072 pixels on the longest edge at JPEG quality 95 with 4:4:4 chroma; EXIF is still removed. Existing stored images cannot regain discarded detail. A 22nd integration test verifies dimensions and metadata removal. This preprocessing repair is independent of whether fine-tuning beats the baseline.

Keep the Colab notebook open. Free runtimes can disconnect; download the results ZIP when complete. The ZIP contains weights, split/hash manifest and comparison metrics. Review precision, recall and annotated examples before replacing the live detector.

The notebook also reports recall at confidence 0.45 and IoU 0.5 for held-out scratch boxes covering at most 1% of the image. This is image-relative annotation size, not scratch width in millimetres. Fewer than 20 such labels is flagged as an inadequate sample.

## Completed result
See RESULTS-2026-11-03.md and RESULTS-2026-11-03.json. Training and held-out evaluations completed; candidate rejected because small-scratch recall fell from 3/99 to 0/99. Existing detector retained.
