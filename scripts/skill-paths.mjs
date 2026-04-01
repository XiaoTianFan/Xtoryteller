import path from 'node:path';

const root = process.cwd();

export const SKILLS_DIR = path.join(root, 'skills');
export const XTORYTELLER_SKILL_DIR = path.join(SKILLS_DIR, 'xtoryteller');
export const XTORYTELLER_REFERENCES_DIR = path.join(XTORYTELLER_SKILL_DIR, 'references');
export const XTORYTELLER_GUIDES_DIR = path.join(XTORYTELLER_REFERENCES_DIR, 'guides');
export const XTORYTELLER_REGISTRIES_DIR = path.join(XTORYTELLER_REFERENCES_DIR, 'registries');
export const XTORYTELLER_SCHEMA_DIR = path.join(XTORYTELLER_REFERENCES_DIR, 'schema');
export const XTORYTELLER_EXAMPLES_DIR = path.join(XTORYTELLER_REFERENCES_DIR, 'examples');
