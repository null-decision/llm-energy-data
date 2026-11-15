# Timed runs

Source id: `null-decision-timed-runs`. These are our own measurements of output speed and time to first token, for models that no open source measures. Anyone with API access can repeat them.

## How we measured

- **Date:** 2026-11-10, in one session: one client machine, one network, one time of day.
- **Prompt:** `Explain how a heat pump works, in about 400 words.` The same prompt for every answer, with nothing before it.
- **Output cap:** 1,500 tokens.
- **Answers:** 10 per model, one after another, streamed.
- **Reasoning:** off. A model that can't turn reasoning off ran at its lightest level; the entry records the level.
- **Endpoints:** each provider's own API: Mistral's EU endpoint (`api.eu.mistral.ai`), DeepSeek's API and xAI's API.

For each answer we recorded:

- **Time to first token:** seconds from sending the request to the first piece of text. Network time is included.
- **Output tokens:** as the API reports them, reasoning included.
- **Output speed:** output tokens divided by the time from the first text to the end of the answer.

An answer counts only if it has at least 100 output tokens and ends after its first text. Each entry gives the median over the answers that count, rounded to 0.1 tokens per second and 0.01 seconds.

## Results

| Model | Provider | Reasoning | Answers | Tokens per second | First token (s) |
| --- | --- | --- | --- | --- | --- |
| Mistral Medium 3.5 | Mistral (EU) | none | 10 | 144.1 | 0.30 |
| DeepSeek-V4-Pro | DeepSeek | none | 10 | 52.1 | 0.96 |
| Grok 4.3 | xAI | none | 10 | 57.7 | 0.62 |
| Grok 4.6 | xAI | low | 10 | 70.5 | 6.62 |

- **Grok 4.6** can't turn reasoning off, so its first text waits for hidden reasoning, which also counts as output. The two numbers together still reproduce each answer's total time.
- **Kimi K3** always reasons. Asked for no reasoning, the API used its default level, max: the first answer spent the whole 1,500-token cap on reasoning and wrote no text, so the run stopped and there is no result. Measuring it needs a cap of about 5,000 tokens.

## Limits

- One prompt, one length of answer, one session. Speed changes with load, region, time of day and answer length, so treat these as one snapshot, not a typical value.
- Time to first token includes the network between our client and the provider.
- Ten answers per model is a small sample.
