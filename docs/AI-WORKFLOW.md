# Four-stage local AI workflow

Ballighni uses a pretrained YOLOv8n damage detector plus separate language-model roles through local Ollama. It does not claim four separately trained accident models or a validated insurer estimator.

1. Damage detection: the pinned pretrained model identifies possible visible damage regions and labels. Every observation cites its source image. No detection is not proof of no damage.
2. Assessment and repair reference: a separate local model call summarizes the detector's unverified observations, visible extent and missing evidence. This is not a mechanical severity or roadworthiness assessment. A deterministic calculator maps supported categories to published, conditional AED workshop scenarios. The language model cannot supply prices. Repeated detections across photographs are not summed, and a whole-car total is never fabricated. Unsupported parts require a vehicle-specific quote.
3. Testimony: a separate model call summarizes each attributed statement. After an accepted connection, the reviewer can request a multi-account comparison. Exact supporting quotes are validated against the original text; invented quotes, missing sources and unsupported verdicts are rejected. Disagreements remain questions for human review.
4. Report: a separate model call drafts an overview, evidence summary and next steps. The reporter chooses whether to put it in the confirmation form, edits it and confirms. Background completion never overwrites typed text or the original statement. The joint report preserves both originals, confirmed drafts, evidence and the reviewed comparison.

The local text runtime is configurable with TEXT_AI_ENABLED, TEXT_AI_URL, TEXT_AI_MODEL and TEXT_AI_TIMEOUT_MS. Only the backend accesses it; never expose port 11434 or the detector port 8787 to the internet. Model requests are serialized and CPU threads are bounded. The API returns a saved draft immediately after image analysis and runs the text roles in the background, avoiding a long tunnel request. The UI polls without replacing the editable confirmation form. Restarted jobs are marked interrupted and require a retry.

AI may be unavailable, slow or wrong. Missing outputs are marked unavailable, and the independent reports remain available for manual review. Model-specific quality and UAE-domain accuracy have not been independently benchmarked. Larger models require more laptop resources. No paid AI API is configured.

## AED pricing basis checked 3 November 2026

- BodyShop.ae publishes a localized minor dent/scratch guide of AED 300–1,000, subject to paint condition: https://bodyshop.ae/accident-repair/.
- AutoRepairUAE publishes a repairable dent-and-repaint guide of AED 665–2,095 per panel before VAT; blending is separate: https://autorepairuae.com/services/car-dent-repair-dubai/.

These are conditional reference scenarios, not an endorsement, quote, repair authorization, market-wide price or insurance valuation. Vehicle details, hidden damage, parts, paint and workshop inspection can change the price. No panel count or eligibility is inferred from a photo. Alternative scenarios are not added together. Structural work, broken lamps/glass, absent or displaced parts and other unsupported observations are left unpriced.

## Testing

Automated checks cover grounded references, duplicate-image category grouping, unsupported-cost refusal, exact-quote comparison, invented-quote rejection, separate model calls, owner/reviewer controls, consent and original-testimony preservation. Live model and end-to-end results are recorded in DELIVERY-REPORT.md; mocked tests alone are not evidence of successful real inference.


## Delivered laptop model

The verified text configuration is `qwen3.5:9b` through the installed local Ollama runtime, with four text-model CPU threads and two detector threads. On a fresh laptop run `ollama pull qwen3.5:9b`, set `TEXT_AI_ENABLED=true` and `TEXT_AI_MODEL=qwen3.5:9b` in `.env`, then keep Ollama running. The model needs several gigabytes of disk/RAM and can take several minutes per workflow on CPU. The optional compact-model download was stopped and is not needed for the delivered setup.
