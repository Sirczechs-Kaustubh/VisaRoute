import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const projectRoot = process.cwd();
const schemaPath = resolve(projectRoot, "prisma", "schema.prisma");
const initSqlPath = resolve(projectRoot, "prisma", "init.sql");
const databasePath = resolve(projectRoot, "prisma", "dev.db");

function resetDatabaseFiles() {
  [databasePath, `${databasePath}-journal`, `${databasePath}-shm`, `${databasePath}-wal`].forEach(
    (filePath) => {
      if (existsSync(filePath)) {
        rmSync(filePath, { force: true });
      }
    },
  );
}

function run(command, args, options = {}) {
  const executable = process.platform === "win32" && command === "npx" ? "npx.cmd" : command;

  return execFileSync(executable, args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...options,
  });
}

function main() {
  mkdirSync(dirname(initSqlPath), { recursive: true });
  resetDatabaseFiles();

  const sql = run("npx", [
    "prisma",
    "migrate",
    "diff",
    "--from-empty",
    "--to-schema-datamodel",
    schemaPath,
    "--script",
  ]);

  writeFileSync(initSqlPath, sql);

  run("npx", [
    "prisma",
    "db",
    "execute",
    "--file",
    initSqlPath,
    "--url",
    `file:${databasePath.replace(/\\/g, "/")}`,
  ]);

  execFileSync("node", [resolve(projectRoot, "prisma", "seed.js")], {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: `file:${databasePath.replace(/\\/g, "/")}`,
    },
  });

  process.stdout.write("SQLite database initialized successfully.\n");
}

main();
