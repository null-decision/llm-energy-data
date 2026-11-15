# llm-energy-data

Open, sourced facts about large language models, for estimating the energy behind an AI answer and for choosing a model: how big a model is, how large its published weights are, how fast it answers, what it costs and how people rate it. **Every number names its source and the day it was checked.**

## Why this exists

Every chat app or gateway that estimates energy, or picks a model for a task, needs the same facts about each model. Today they are scattered: prices on provider pages, weight sizes on Hugging Face, ratings on the LMArena leaderboard, speeds on third-party sites. [EcoLogits](https://ecologits.ai)' `models.json` is the one widely used file with energy inputs. This table starts from its fields and adds what it lacks: the size of the published weights (which shows the precision a model ships in), measured speeds, prices and quality ratings, each with its source.

The table holds inputs, not results. Energy per answer isn't stored: an estimator such as EcoLogits computes it from these inputs.

## Status: v0 (November 2026)

29 models: the catalogue of [Mantle Chat](https://mantle.chat), whose makers, Null Decision, maintain this table.

| Field | Models | Where it comes from |
| --- | --- | --- |
| Model type and parameters | 27 (21 of them estimates) | Model cards for open models; EcoLogits' estimates for closed ones |
| Size of published weights | 6 (all open models) | Hugging Face |
| Measured speed | 4 | [Our timed runs](docs/methods/timed-runs.md) |
| Price | 28 | Provider price pages |
| Quality ratings | 28 | LMArena leaderboard dataset |
| Tokens per task | 0 | Not measured yet |

## What an entry looks like

One file per model: `data/models/<developer>/<model>.json`. The [schema](schema/model.schema.json) describes every field. A shortened entry:

```json
{
  "id": "deepseek/deepseek-v4-pro",
  "name": "DeepSeek-V4-Pro",
  "developer": "deepseek",
  "open_weights": true,
  "architecture": {
    "type": { "value": "moe", "source": "model-card", "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro", "checked_at": "2026-11-15" },
    "total_params_b": { "value": 1600, "source": "model-card", "url": "…", "checked_at": "2026-11-15" },
    "active_params_b": { "value": 49, "source": "model-card", "url": "…", "checked_at": "2026-11-15" },
    "weights_gb": { "value": 892.7, "hf_repo": "deepseek-ai/DeepSeek-V4-Pro-0813", "source": "huggingface-hub", "checked_at": "2026-11-15" }
  },
  "speeds": [{ "provider": "deepseek", "api_model": "deepseek-v4-pro", "tokens_per_second": 52.1, "time_to_first_token_s": 0.96, "answers": 10, "…": "…" }],
  "tokens_per_task": [],
  "prices": [{ "provider": "deepseek", "api_model": "deepseek-v4-pro", "input_per_mtok": 1.32, "output_per_mtok": 3.96, "…": "…" }],
  "quality": [{ "leaderboard": "lmarena", "arena": "text", "entry": "DeepSeek-V4-Pro (High, 20260813)", "ratings": { "overall": { "rating": 1463.9, "…": "…" } }, "…": "…" }]
}
```

## How to read the numbers

- **Every number sits in an object with `source` and `checked_at`.** `source` is an id from [`data/sources.json`](data/sources.json), which gives the publisher, the licence and how to credit it; `url` points to the exact page when a source has many.
- **Ranges** (`min` and `max`) mean the value is uncertain. **`estimated: true`** means the source estimates it because the developer hasn't published it, as for every closed model's parameters.
- **A missing field** means nobody publishes it and we have no estimate. Grok 4.6 and Grok 4.3 have no parameters: xAI publishes none and EcoLogits has no entry for them.
- **Parameters** are in billions. Active parameters are the ones used for each generated token.
- **Weights** are one copy of the published `.safetensors` files, in GB (10^9 bytes).
- **Speeds** vary with load, region, time of day and answer length. Each record says how many answers it rests on, when and how.
- **Prices** are list prices in USD per million tokens, standard tier, text input. Some depend on prompt length, time of day or date: `applies_to`, `valid_from` and `valid_until` say which. A regional endpoint costs the list price times its `multiplier`.
- **Quality ratings** are only comparable within one arena, one category and one snapshot. Each record names the leaderboard entry it copies, its reasoning level as the entry name states it (`not_stated` when the name says nothing), and how well it matches the model: `exact`, `other_checkpoint` (a dated or preview release of the same model) or `checkpoint_not_stated`.

## Sources and licences

| What | Licence | How to credit it |
| --- | --- | --- |
| Our own data: timed runs, the matching of models across sources, notes | [CC BY 4.0](LICENSE-DATA) | llm-energy-data by Null Decision, https://github.com/null-decision/llm-energy-data |
| Quality ratings (`lmarena-leaderboard`) | CC BY 4.0 | Ratings from the Arena leaderboard by LMArena (https://arena.ai/leaderboard), `lmarena-ai/leaderboard-dataset` on Hugging Face. We round ratings to one decimal. |
| Parameters of closed models and model types (`ecologits-0.11.3`) | MPL-2.0 | EcoLogits (https://ecologits.ai), `models.json`, release 0.11.3 |
| Prices, parameters from model cards, file sizes | Single facts from public pages | The `url` of each value |
| Code: schema and scripts | [MIT](LICENSE) | |

Values copied from another source keep that source's licence. If you reuse the table, credit the sources whose values you use.

### What is not here, on purpose

- **Artificial Analysis.** Its redistribution terms are unclear, so none of its numbers are copied here.
- **CLEER (Sustainable AI Group).** Its data is licensed for non-commercial use only, so it never goes into this table.
- **EcoLogits' speeds.** EcoLogits takes them from OpenRouter, whose terms for republishing them are unclear. Read them in EcoLogits itself.
- **Data about anyone's users or traffic.** The table holds no customer data and no usage data from Mantle Chat or anyone else.

The validation check rejects any value that links to Artificial Analysis or CLEER.

## Known gaps in v0

- **Tokens per task** is empty. Answer length differs up to ten times between models, so it matters most for energy; we plan to measure it on a fixed public set of prompts at each reasoning level.
- **Speeds** cover 4 models, from one short session each.
- **Closed models' parameters** are EcoLogits' estimates, with wide ranges.
- **Reasoning levels** of leaderboard entries without a level in their name are recorded as `not_stated`.

## Check the data

```bash
npm ci
npm run validate
```

`npm run validate` checks every file against the schema, and also that each entry sits at the path of its id, every source is listed, ranges and intervals are in order and no date is in the future. `npm run format` fixes the formatting. The same check runs on every pull request.

## Contributing

Corrections and new models are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

Code (schema and scripts): [MIT](LICENSE). Our own data: [CC BY 4.0](LICENSE-DATA). Values from other sources keep their licences, listed in [`data/sources.json`](data/sources.json).
