# Architecture Overview

Xtoryteller combines file-backed presentation definitions with a React runtime and agent-readable registries.

- Presentations are YAML.
- Render primitives live in code.
- Manifests describe those primitives for agents.
- The dashboard discovers presentations from disk.
- Stage mode and Map mode share a common runtime shell.
