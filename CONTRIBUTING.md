# Contributing

Thank you for helping. The table is only as good as its sources, so most of this page is about them.

## What helps most

- **Corrections.** A price changed, a model card gives a different parameter count, a leaderboard entry belongs to another release. Point us to the page.
- **New models**, with at least the fields you can source.
- **Measurements** of speed or tokens per task, made with a method anyone can repeat.

If you can't open a pull request, [open an issue](https://github.com/null-decision/llm-energy-data/issues) with a link to the source. That is enough.

## Rules for every value

1. **Name the source.** Use an id from [`data/sources.json`](data/sources.json). For a new source, add it there with its publisher, URL and licence.
2. **Link the exact page** in `url` when the source has many pages.
3. **Date it.** `checked_at` is the day you read the value at the source, not the day the source published it.
4. **Copy, don't compute.** Write the number as the source states it. If you change it, for example by rounding, say so in `note`.
5. **Show uncertainty.** Use `min` and `max` when a value is uncertain, and `estimated: true` when the source estimates a value the developer hasn't published.
6. **Don't average sources.** When sources disagree, keep the developer's own value and mention the other in `note`.
7. **Numbers only.** Copy single facts, never tables, text or charts.

## Sources we can't use

- **Artificial Analysis**: its redistribution terms are unclear.
- **CLEER (Sustainable AI Group)**: its data is licensed for non-commercial use only.
- Any source with a non-commercial (NC) or no-derivatives (ND) licence, or with terms that don't allow republishing.
- Data about anyone's users or traffic, even aggregated, unless it comes as a separate, documented dataset that its owner has agreed to publish.

Good licences are CC0, CC BY, MIT, Apache-2.0 and MPL-2.0. Prices, parameter counts and file sizes read from a provider's public page are single facts, and their `url` is the credit.

## Measurements

Describe the method in `docs/methods/` before adding the numbers: the prompts (public), the settings, how many answers, when and where you ran them, and how you computed the result. Then add the values with a `source` that points to that file. See [timed runs](docs/methods/timed-runs.md) for an example.

## How to send a change

1. Fork the repository and edit or add `data/models/<developer>/<model>.json`. The [schema](schema/model.schema.json) describes every field; an editor that reads JSON Schema will check the file as you type.
2. Run the check:

   ```bash
   npm ci
   npm run validate
   ```

   `npm run format` fixes the formatting.
3. Open a pull request. Say what changed and where you checked it. One model or one source per pull request is easiest to review.

## Licence of contributions

By contributing, you agree that your code is licensed under [MIT](LICENSE) and your data under [CC BY 4.0](LICENSE-DATA). Values you copy from another source keep that source's licence; list it in `data/sources.json`.
