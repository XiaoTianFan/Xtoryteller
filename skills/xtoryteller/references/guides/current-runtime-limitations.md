# Current Runtime Limitations

Read this file before promising behavior that sounds broader than what the shipped viewer currently guarantees.

## Important Current Boundaries

- Presentation-scoped `components/`, `layouts/`, and `transitions/` do resolve at runtime, but portability and promotion workflows still matter when a one-off primitive should become reusable across decks.

- Markdown-rendered content supports hover annotations through `{{hover:key|Label}}` plus `component.annotations`.
  The broader APRD-wide `annotation anywhere` model is still not guaranteed across arbitrary components and diagram internals.

- Component-level `enter` and `exit` props are runtime-supported and validated, but they should still be visually checked when the storytelling depends on subtle motion.

- Transition names, background switching, Paper shader backgrounds, CSS backgrounds, and reduced-motion behavior are shipped, but the APRD still describes richer motion semantics than the current viewer guarantees.

- The APRD is broader than the shipped runtime. Use the nearest supported path instead of promising an aspirational feature.

## Practical Alternatives

- If a component does not render markdown through the shared markdown path, use visible callouts, footnotes, labels, or step splits instead of assuming annotation support.
- Instead of inventing a one-off local primitive, prefer a global reusable primitive when the feature should matter beyond one deck.
- Instead of squeezing more into a step, add another step or cluster.

## Validation Reminder

The validator catches more issues now, but it does not replace visual review for advanced behavior. Always open the presentation in the browser when the change depends on motion or nuanced layout behavior.
