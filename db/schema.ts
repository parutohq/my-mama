import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';
export const careRecords = sqliteTable(
  'care_records',
  {
    owner: text('owner').notNull(),
    id: text('id').notNull(),
    kind: text('kind').notNull(),
    payload: text('payload').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.owner, table.id] })],
);
