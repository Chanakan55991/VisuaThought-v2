import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";

export const notes = sqliteTable(
  "notes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updatedAt"),
    isDefault: integer("isDefault").default(0),
    content: text("content"),
    authorId: text("authorId"),
    positionX: real("positionX").default(16),
    positionY: real("positionY").default(24),
  },
  (table) => {
    return {
      authorIdx: index("author_idx").on(table.authorId),
    };
  },
);
