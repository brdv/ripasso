import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const SYSTEM_OWNER_ID = "system";
export const BASE_LIST_ID = "basis";
export const BASE_LIST_NAME = "Basis";

export const entries = sqliteTable(
  "entries",
  {
    id: text("id").primaryKey(),
    type: text("type", { enum: ["word", "verb"] }).notNull(),
    ownerId: text("owner_id").notNull(),
    visibility: text("visibility", { enum: ["private", "public"] }).notNull(),
    /** JSON of the `StudyEntry` fields other than `id` and `type`. */
    data: text("data").notNull(),
    /** Lowercased, accent-stripped Italian, Dutch, and lemma for `LIKE` search. */
    searchText: text("search_text").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("entries_owner_id_idx").on(table.ownerId)],
);

export const lists = sqliteTable(
  "lists",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    visibility: text("visibility", { enum: ["private", "unlisted", "public"] }).notNull(),
    shareSlug: text("share_slug").unique(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("lists_owner_id_idx").on(table.ownerId)],
);

export const listEntries = sqliteTable(
  "list_entries",
  {
    listId: text("list_id").notNull(),
    entryId: text("entry_id").notNull(),
    position: integer("position").notNull(),
    addedAt: integer("added_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.listId, table.entryId] }),
    index("list_entries_entry_id_idx").on(table.entryId),
  ],
);

export const progress = sqliteTable(
  "progress",
  {
    userId: text("user_id").notNull(),
    cardId: text("card_id").notNull(),
    box: integer("box").notNull(),
    seen: integer("seen").notNull(),
    correct: integer("correct").notNull(),
    wrong: integer("wrong").notNull(),
    last: integer("last").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.cardId] })],
);

export type EntryRow = typeof entries.$inferSelect;
export type ListRow = typeof lists.$inferSelect;

// Better Auth tables (email and password). Column names follow Better Auth's defaults.

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);
