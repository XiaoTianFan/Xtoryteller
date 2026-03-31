# Architecture

Xtoryteller is a file-system-first presentation runtime.

- Presentation content is authored in YAML.
- Components, layouts, and transitions are real code with agent-readable manifests.
- The dashboard and presentation routes read directly from the `presentations/` directory.
- Runtime navigation is managed through XState.
- Stage mode handles linear step/build progression.
- Map mode handles cluster exploration, guided sequences, and camera movement.
