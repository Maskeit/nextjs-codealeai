-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKey" TEXT,
    "authHeader" TEXT NOT NULL DEFAULT 'Authorization',
    "authScheme" TEXT DEFAULT 'Bearer',
    "extraHeaders" TEXT,
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Provider" ("apiKey", "authHeader", "authScheme", "baseUrl", "createdAt", "extraHeaders", "id", "isActive", "name", "protocol", "slug", "updatedAt") SELECT "apiKey", "authHeader", "authScheme", "baseUrl", "createdAt", "extraHeaders", "id", "isActive", "name", "protocol", "slug", "updatedAt" FROM "Provider";
DROP TABLE "Provider";
ALTER TABLE "new_Provider" RENAME TO "Provider";
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
