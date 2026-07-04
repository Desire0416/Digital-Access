// Point d'entrée public de @da/db.
// Le client Prisma est exposé séparément via `@da/db/client` afin que les
// vues publiques puissent fonctionner sans base de données provisionnée.
export * from "./src/types";
export * from "./src/mock";
