-- migrate:up
ALTER TABLE characters RENAME COLUMN race TO species;
ALTER TABLE characters RENAME COLUMN subrace TO lineage;

-- migrate:down
ALTER TABLE characters RENAME COLUMN species TO race;
ALTER TABLE characters RENAME COLUMN lineage TO subrace;
