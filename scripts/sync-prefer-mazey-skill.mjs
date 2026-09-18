/* eslint-env node */

import { spawnSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import {
  access,
  cp,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

const SKILL_NAME = "prefer-mazey";
const EXPECTED_REMOTE = "github.com/chengchuu/skills";
const TEMP_PREFIX = `.${SKILL_NAME}-sync-`;

function fail(message) {
  throw new Error(message);
}

async function pathExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const options = { check: false, dryRun: false, target: undefined };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
    } else if (argument === "--dry-run") {
      options.dryRun = true;
    } else if (argument === "--target") {
      if (options.target !== undefined) fail("--target may only be provided once.");
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) fail("--target requires a repository path.");
      options.target = value;
      index += 1;
    } else {
      fail(`Unsupported argument: ${argument}`);
    }
  }

  if (options.check && options.dryRun) {
    fail("--check and --dry-run cannot be used together.");
  }

  return options;
}

function runGit(args, cwd) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: [ "ignore", "pipe", "pipe" ],
  });

  if (result.error) {
    fail(`Unable to run Git in ${cwd}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit code ${result.status}`;
    fail(`Git validation failed in ${cwd}: ${detail}`);
  }

  return result.stdout.trim();
}

function normalizeRemote(remote) {
  const value = remote.trim();
  const scpMatch = /^git@github\.com:(.+)$/i.exec(value);
  if (scpMatch) {
    const repositoryPath = scpMatch[1].replace(/^\/+|\/+$/g, "").replace(/\.git$/i, "");
    return `github.com/${repositoryPath.toLowerCase()}`;
  }

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    const isHttps = parsed.protocol === "https:"
      && hostname === "github.com"
      && parsed.username === ""
      && parsed.password === ""
      && parsed.port === "";
    const isSsh = parsed.protocol === "ssh:"
      && parsed.username === "git"
      && parsed.password === ""
      && (
        (hostname === "github.com" && (parsed.port === "" || parsed.port === "22"))
        || (hostname === "ssh.github.com" && parsed.port === "443")
      );
    if (
      (!isHttps && !isSsh)
      || parsed.search !== ""
      || parsed.hash !== ""
    ) {
      return undefined;
    }

    const pathname = parsed.pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/i, "");
    return `github.com/${pathname.toLowerCase()}`;
  } catch {
    return undefined;
  }
}

function parseQuotedScalar(value, filePath, key) {
  const doubleQuoted = /^("(?:[^"\\]|\\.)*")\s*(?:#.*)?$/.exec(value);
  if (doubleQuoted) {
    try {
      return JSON.parse(doubleQuoted[1]);
    } catch {
      fail(`${filePath} has an invalid double-quoted YAML value for ${key}.`);
    }
  }

  const singleQuoted = /^'((?:[^']|'')*)'\s*(?:#.*)?$/.exec(value);
  if (singleQuoted) return singleQuoted[1].replace(/''/g, "'");
  return undefined;
}

function isImplicitNonStringYamlScalar(scalar) {
  const normalized = scalar.replace(/_/g, "");
  return /^(?:~|null|true|false|yes|no|on|off)$/i.test(normalized)
    || /^[+-]?\.(?:inf|nan)$/i.test(normalized)
    || /^[+-]?(?:0b[01]+|0o[0-7]+|0x[0-9a-f]+)$/i.test(normalized)
    || /^[+-]?0[0-7]+$/.test(normalized)
    || /^[+-]?(?:0|[1-9]\d*)$/.test(normalized)
    || /^[+-]?(?:(?:\d+\.\d*|\.\d+)(?:e[+-]?\d+)?|\d+e[+-]?\d+)$/i.test(normalized)
    || /^[+-]?\d+(?::[0-5]?\d)+(?:\.\d*)?$/.test(normalized)
    || /^\d{4}-\d{1,2}-\d{1,2}$/.test(normalized)
    || /^\d{4}-\d{1,2}-\d{1,2}(?:[Tt]|[ \t]+)\d{1,2}:\d{2}:\d{2}(?:\.\d*)?(?:[ \t]*(?:Z|[+-]\d{1,2}(?::?\d{2})?))?$/.test(normalized);
}

function parsePlainScalar(value, filePath, key) {
  const scalar = value.replace(/\s+#.*$/, "").trim();
  if (
    scalar === ""
    || /^[!&*{}[\],#|>@`"']/.test(scalar)
    || /^(?:[-?:](?:\s|$))/.test(scalar)
    || /:\s/.test(scalar)
    || isImplicitNonStringYamlScalar(scalar)
  ) {
    fail(`${filePath} has an unsupported or non-string YAML value for ${key}. Quote the value when needed.`);
  }
  return scalar;
}

function parseFrontmatter(markdown, filePath) {
  const lines = markdown.split(/\r?\n/);
  if (lines[0] !== "---") {
    fail(`${filePath} must start with YAML frontmatter.`);
  }

  const endIndex = lines.indexOf("---", 1);
  if (endIndex === -1) {
    fail(`${filePath} has unterminated YAML frontmatter.`);
  }

  const fields = new Map();
  for (let index = 1; index < endIndex; index += 1) {
    const line = lines[index];
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    if (/^\s/.test(line)) {
      fail(`${filePath} uses unsupported nested YAML at line ${index + 1}.`);
    }

    const match = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (!match) fail(`${filePath} has invalid YAML frontmatter at line ${index + 1}.`);
    if (fields.has(match[1])) fail(`${filePath} repeats the YAML key ${match[1]}.`);

    let value = match[2].trim();
    const blockMatch = /^([|>])([+-])?\s*(?:#.*)?$/.exec(value);
    if (blockMatch) {
      const blockLines = [];
      let indentation;
      for (index += 1; index < endIndex; index += 1) {
        const blockLine = lines[index];
        if (blockLine !== "" && !/^\s/.test(blockLine)) break;
        const indentationPrefix = /^[ \t]*/.exec(blockLine)[0];
        if (indentationPrefix.includes("\t")) {
          fail(`${filePath} uses a tab for YAML indentation at line ${index + 1}.`);
        }
        if (blockLine.trim() !== "") {
          if (indentation === undefined) {
            indentation = indentationPrefix.length;
          } else if (indentationPrefix.length < indentation) {
            fail(`${filePath} dedents a YAML block scalar at line ${index + 1}.`);
          }
        }
        blockLines.push(blockLine);
      }
      index -= 1;

      const normalizedLines = blockLines.map(blockLine => (
        blockLine.trim() === "" ? "" : blockLine.slice(indentation ?? 0)
      ));
      value = blockMatch[1] === ">"
        ? normalizedLines.join(" ").trim()
        : normalizedLines.join("\n").trim();
    } else {
      value = parseQuotedScalar(value, filePath, match[1])
        ?? parsePlainScalar(value, filePath, match[1]);
    }
    fields.set(match[1], value);
  }

  return fields;
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function collectTree(root) {
  if (!(await pathExists(root))) return new Map();

  const rootStats = await lstat(root);
  if (rootStats.isSymbolicLink()) fail(`Symbolic-link skill roots are not supported: ${root}`);
  if (!rootStats.isDirectory()) fail(`Expected a directory: ${root}`);

  const tree = new Map();

  async function walk(directory, relativeDirectory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.join(relativeDirectory, entry.name);
      const stats = await lstat(absolutePath);

      if (stats.isSymbolicLink()) {
        fail(`Symbolic links are not synchronized: ${absolutePath}`);
      }
      if (stats.isDirectory()) {
        tree.set(relativePath, { type: "directory" });
        await walk(absolutePath, relativePath);
      } else if (stats.isFile()) {
        tree.set(relativePath, {
          content: await readFile(absolutePath),
          type: "file",
        });
      } else {
        fail(`Unsupported filesystem entry in skill: ${absolutePath}`);
      }
    }
  }

  await walk(root, "");
  return tree;
}

function displayEntry(relativePath, entry) {
  return entry?.type === "directory" ? `${relativePath}/` : relativePath;
}

function compareTrees(sourceTree, targetTree) {
  const added = [];
  const updated = [];
  const removed = [];

  for (const [ relativePath, sourceEntry ] of sourceTree) {
    const targetEntry = targetTree.get(relativePath);
    if (!targetEntry) {
      added.push(displayEntry(relativePath, sourceEntry));
    } else if (
      sourceEntry.type !== targetEntry.type
      || (sourceEntry.type === "file" && !sourceEntry.content.equals(targetEntry.content))
    ) {
      updated.push(displayEntry(relativePath, sourceEntry));
    }
  }

  for (const [ relativePath, targetEntry ] of targetTree) {
    if (!sourceTree.has(relativePath)) {
      removed.push(displayEntry(relativePath, targetEntry));
    }
  }

  const sort = values => values.sort((left, right) => left.localeCompare(right));
  return { added: sort(added), updated: sort(updated), removed: sort(removed) };
}

function printList(label, values) {
  console.log(`${label}:`);
  if (values.length === 0) {
    console.log("  (none)");
    return;
  }
  for (const value of values) console.log(`  - ${value}`);
}

function printSummary(sourcePath, targetPath, differences) {
  console.log(`Source path: ${sourcePath}`);
  console.log(`Target path: ${targetPath}`);
  printList("Copied files", differences.added.filter(value => !value.endsWith("/")));
  printList("Updated files", differences.updated.filter(value => !value.endsWith("/")));
  printList("Removed files", differences.removed.filter(value => !value.endsWith("/")));

  const directoryChanges = [
    ...differences.added.filter(value => value.endsWith("/")).map(value => `add ${value}`),
    ...differences.updated.filter(value => value.endsWith("/")).map(value => `replace ${value}`),
    ...differences.removed.filter(value => value.endsWith("/")).map(value => `remove ${value}`),
  ];
  if (directoryChanges.length > 0) printList("Directory changes", directoryChanges);
}

function printReviewCommands(mazeyRoot, skillsRoot) {
  console.log("Suggested Git review commands:");
  console.log(`  cd ${mazeyRoot}`);
  console.log("  git status");
  console.log("  git diff");
  console.log(`  cd ${skillsRoot}`);
  console.log("  git status");
  console.log("  git diff");
}

async function ensureNoInterruptedSync(skillsDirectory) {
  const entries = await readdir(skillsDirectory, { withFileTypes: true });
  const leftovers = entries.filter(entry => entry.name.startsWith(TEMP_PREFIX));
  if (leftovers.length > 0) {
    fail(`Found an interrupted synchronization artifact in ${skillsDirectory}: ${leftovers.map(entry => entry.name).join(", ")}`);
  }
}

async function validateSource(sourcePath) {
  if (!(await pathExists(sourcePath))) fail(`Source skill directory does not exist: ${sourcePath}`);

  const skillFile = path.join(sourcePath, "SKILL.md");
  const apiMap = path.join(sourcePath, "references", "mazey-api-map.md");
  if (!(await pathExists(skillFile))) fail(`Source skill is missing SKILL.md: ${skillFile}`);
  if (!(await pathExists(apiMap))) fail(`Source skill is missing its API map: ${apiMap}`);

  const fields = parseFrontmatter(await readFile(skillFile, "utf8"), skillFile);
  if (fields.get("name") !== SKILL_NAME) {
    fail(`Source skill frontmatter name must be ${SKILL_NAME}; found ${fields.get("name") || "nothing"}.`);
  }
  if (!fields.get("description")?.trim()) {
    fail(`Source skill frontmatter must contain a non-empty description: ${skillFile}`);
  }

  return collectTree(sourcePath);
}

async function validateSkillsRepository(requestedRoot) {
  const resolvedRoot = path.resolve(requestedRoot);
  if (resolvedRoot === path.parse(resolvedRoot).root) {
    fail(`The public skills repository cannot be the filesystem root: ${resolvedRoot}`);
  }
  if (!(await pathExists(resolvedRoot))) {
    fail(`The public skills repository does not exist: ${resolvedRoot}`);
  }

  const rootStats = await lstat(resolvedRoot);
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    fail(`The public skills repository must be an unambiguous directory, not a file or symbolic link: ${resolvedRoot}`);
  }

  const canonicalRoot = await realpath(resolvedRoot);
  const gitRoot = await realpath(runGit([ "rev-parse", "--show-toplevel" ], canonicalRoot));
  if (gitRoot !== canonicalRoot) {
    fail(`--target and MAZEY_SKILLS_REPO must point to the public repository root. Resolved Git root: ${gitRoot}`);
  }

  const remotes = runGit([ "remote" ], canonicalRoot).split(/\r?\n/).filter(Boolean);
  if (remotes.length > 0) {
    const remote = remotes.includes("origin")
      ? "origin"
      : remotes.length === 1
        ? remotes[0]
        : undefined;
    if (!remote) {
      fail(`The public repository has multiple remotes and no origin, so resolution is ambiguous: ${remotes.join(", ")}`);
    }

    const fetchUrls = runGit([ "remote", "get-url", "--all", remote ], canonicalRoot).split(/\r?\n/).filter(Boolean);
    const pushUrls = runGit([ "remote", "get-url", "--push", "--all", remote ], canonicalRoot).split(/\r?\n/).filter(Boolean);
    const remoteUrls = [ ...new Set([ ...fetchUrls, ...pushUrls ]) ];
    if (remoteUrls.length === 0 || remoteUrls.some(url => normalizeRemote(url) !== EXPECTED_REMOTE)) {
      fail(`Git remote ${remote} must resolve only to https://${EXPECTED_REMOTE}. Found: ${remoteUrls.join(", ") || "no URLs"}`);
    }
  }

  const skillsDirectory = path.join(canonicalRoot, "skills");
  const targetPath = path.join(skillsDirectory, SKILL_NAME);
  if (!(await pathExists(skillsDirectory)) || !(await lstat(skillsDirectory)).isDirectory()) {
    fail(`The declared public skills directory does not exist: ${skillsDirectory}`);
  }
  if (!isInside(canonicalRoot, skillsDirectory) || path.relative(skillsDirectory, targetPath) !== SKILL_NAME) {
    fail(`Target skill path is not safely contained in ${skillsDirectory}: ${targetPath}`);
  }
  if (targetPath === canonicalRoot) {
    fail("The synchronization target resolved to the public repository root instead of the individual skill directory.");
  }

  const validatorPath = path.join(canonicalRoot, "scripts", "validate-skills.mjs");
  if (!(await pathExists(validatorPath))) {
    fail(`The public repository validator is missing: ${validatorPath}`);
  }

  await ensureNoInterruptedSync(skillsDirectory);
  return { root: canonicalRoot, skillsDirectory, targetPath, validatorPath };
}

function runPublicValidator(repositoryRoot, validatorPath, ignoredPath) {
  const result = spawnSync(process.execPath, [ validatorPath ], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      SKILLS_VALIDATOR_IGNORE_PATH: ignoredPath,
    },
    stdio: "inherit",
  });

  if (result.error) fail(`Unable to run the public skills validator: ${result.error.message}`);
  if (result.status !== 0) fail(`Public skills validation failed with exit code ${result.status}.`);
}

async function removeOwnedTemporaryDirectory(temporaryRoot, skillsDirectory) {
  if (path.dirname(temporaryRoot) !== skillsDirectory || !path.basename(temporaryRoot).startsWith(TEMP_PREFIX)) {
    fail(`Refusing to remove an unrecognized temporary path: ${temporaryRoot}`);
  }
  await rm(temporaryRoot, { force: true, recursive: true });
}

async function replaceTargetSafely(sourcePath, repository) {
  const temporaryRoot = await mkdtemp(path.join(repository.skillsDirectory, TEMP_PREFIX));
  const stagedPath = path.join(temporaryRoot, "staged");
  const backupPath = path.join(temporaryRoot, "backup");
  let installedNewTarget = false;
  let movedOldTarget = false;

  try {
    await cp(sourcePath, stagedPath, {
      errorOnExist: true,
      force: false,
      preserveTimestamps: true,
      recursive: true,
    });

    const sourceTree = await collectTree(sourcePath);
    const stagedTree = await collectTree(stagedPath);
    const stagedDifferences = compareTrees(sourceTree, stagedTree);
    if (stagedDifferences.added.length || stagedDifferences.updated.length || stagedDifferences.removed.length) {
      fail("The temporary skill copy did not exactly match the source.");
    }

    if (await pathExists(repository.targetPath)) {
      await rename(repository.targetPath, backupPath);
      movedOldTarget = true;
    }
    await rename(stagedPath, repository.targetPath);
    installedNewTarget = true;

    runPublicValidator(repository.root, repository.validatorPath, temporaryRoot);
    await removeOwnedTemporaryDirectory(temporaryRoot, repository.skillsDirectory);
  } catch (error) {
    try {
      if (installedNewTarget && await pathExists(repository.targetPath)) {
        await rm(repository.targetPath, { force: true, recursive: true });
      }
      if (movedOldTarget && await pathExists(backupPath)) {
        await rename(backupPath, repository.targetPath);
      }
      if (await pathExists(temporaryRoot)) {
        await removeOwnedTemporaryDirectory(temporaryRoot, repository.skillsDirectory);
      }
    } catch (rollbackError) {
      fail(`${error.message}\nRollback also failed: ${rollbackError.message}`);
    }
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const scriptPath = fileURLToPath(import.meta.url);
  const mazeyRoot = path.resolve(path.dirname(scriptPath), "..");
  const sourcePath = path.join(mazeyRoot, ".agents", "skills", SKILL_NAME);
  const requestedSkillsRoot = options.target
    ?? process.env.MAZEY_SKILLS_REPO
    ?? path.resolve(mazeyRoot, "..", "skills");

  const sourceTree = await validateSource(sourcePath);
  const repository = await validateSkillsRepository(requestedSkillsRoot);
  const canonicalSource = await realpath(sourcePath);
  const prospectiveTarget = await pathExists(repository.targetPath)
    ? await realpath(repository.targetPath)
    : repository.targetPath;

  if (canonicalSource === prospectiveTarget || isInside(canonicalSource, prospectiveTarget) || isInside(prospectiveTarget, canonicalSource)) {
    fail(`Source and target must be separate skill directories. Source: ${canonicalSource}; target: ${prospectiveTarget}`);
  }

  const targetTree = await collectTree(repository.targetPath);
  const differences = compareTrees(sourceTree, targetTree);
  const synchronized = differences.added.length === 0
    && differences.updated.length === 0
    && differences.removed.length === 0;

  printSummary(canonicalSource, repository.targetPath, differences);

  if (options.check) {
    console.log(synchronized ? "Synchronization check passed." : "Synchronization check failed: the public copy is out of sync.");
    printReviewCommands(mazeyRoot, repository.root);
    if (!synchronized) process.exitCode = 1;
    return;
  }

  if (options.dryRun) {
    console.log(synchronized ? "Dry run complete: no changes would be made." : "Dry run complete: the listed changes would be made.");
    printReviewCommands(mazeyRoot, repository.root);
    return;
  }

  if (!synchronized) {
    await replaceTargetSafely(canonicalSource, repository);
  } else {
    runPublicValidator(repository.root, repository.validatorPath, "");
  }

  const finalDifferences = compareTrees(sourceTree, await collectTree(repository.targetPath));
  if (finalDifferences.added.length || finalDifferences.updated.length || finalDifferences.removed.length) {
    fail("Synchronization finished but the source and public copy still differ.");
  }

  console.log(synchronized ? "Public skill copy was already synchronized and is valid." : "Public skill copy synchronized and validated successfully.");
  printReviewCommands(mazeyRoot, repository.root);
}

main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
