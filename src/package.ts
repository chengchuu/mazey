import { toJavaScriptGlobalName } from "./util";

/**
 * Package managers supported by {@link derivePackageMetadata}.
 *
 * @category Util
 */
export type PackageManager = "npm" | "pnpm" | "yarn";

/**
 * Author identity accepted from a package manifest.
 *
 * @category Util
 */
export interface PackageManifestAuthor {
  name: string;
  email?: string;
  url?: string;
}

/**
 * Package manifest fields used by {@link derivePackageMetadata}.
 *
 * @category Util
 */
export interface PackageManifest {
  name: string;
  version?: string;
  description?: string;
  license?: string;
  author?: string | PackageManifestAuthor;
}

/**
 * Options for {@link derivePackageMetadata}.
 *
 * @category Util
 */
export interface DerivePackageMetadataOptions {
  /** Package manager used in the generated install command. Defaults to `npm`. */
  packageManager?: PackageManager;
}

/**
 * Normalized package metadata derived from a package manifest.
 *
 * @category Util
 */
export interface DerivedPackageMetadata {
  name: string;
  version?: string;
  description?: string;
  license?: string;
  author: PackageManifestAuthor;
  unscopedName: string;
  iifeGlobal: string;
  installCommand: string;
}

function readOptionalManifestString(
  manifest: Record<string, unknown>,
  field: "version" | "description" | "license"
): string | undefined {
  const value = manifest[field];
  if (value !== undefined && typeof value !== "string") {
    throw new TypeError(`manifest.${field} must be a string when provided`);
  }
  return value;
}

function normalizePackageAuthor(value: unknown): PackageManifestAuthor {
  if (value === undefined) return { name: "" };
  if (typeof value === "string") return { name: value.trim() };
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("manifest.author must be a string or object");
  }

  const author = value as Record<string, unknown>;
  const normalized: PackageManifestAuthor = { name: "" };
  for (const field of [ "name", "email", "url" ] as const) {
    const fieldValue = author[field];
    if (fieldValue !== undefined && typeof fieldValue !== "string") {
      throw new TypeError(`manifest.author.${field} must be a string when provided`);
    }
    if (typeof fieldValue === "string") {
      const trimmedValue = fieldValue.trim();
      if (field === "name" || trimmedValue) normalized[field] = trimmedValue;
    }
  }
  return normalized;
}

function getUnscopedPackageName(name: string): string {
  if (/\s/.test(name)) {
    throw new TypeError("manifest.name must not contain whitespace");
  }

  if (name.startsWith("@")) {
    const parts = name.split("/");
    if (parts.length !== 2 || parts[0].length < 2 || !parts[1]) {
      throw new TypeError("manifest.name must be a valid scoped package name");
    }
    return parts[1];
  }

  if (name.includes("/")) {
    throw new TypeError("manifest.name must be an unscoped or scoped package name");
  }
  return name;
}

/**
 * Validate basic package identity and derive reusable package metadata.
 *
 * The helper removes an npm scope for bundle naming, converts that unscoped
 * name with {@link toJavaScriptGlobalName}, normalizes the supported author
 * fields, and creates an install command for npm, pnpm, or Yarn.
 *
 * Usage:
 *
 * ```javascript
 * import { derivePackageMetadata } from "mazey";
 *
 * const metadata = derivePackageMetadata(
 *   {
 *     name: "@example/my-library",
 *     version: "1.0.0",
 *     author: { name: "Example Maintainer" },
 *   },
 *   { packageManager: "pnpm" }
 * );
 * console.log(metadata);
 * ```
 *
 * Output:
 *
 * ```text
 * {
 *   name: "@example/my-library",
 *   version: "1.0.0",
 *   description: undefined,
 *   license: undefined,
 *   author: { name: "Example Maintainer" },
 *   unscopedName: "my-library",
 *   iifeGlobal: "MY_LIBRARY",
 *   installCommand: "pnpm add @example/my-library"
 * }
 * ```
 *
 * @param manifest Package manifest identity fields. The package name is required.
 * @param options Package-manager selection for the install command.
 * @returns Normalized identity, bundle naming, and installation metadata.
 * @throws {TypeError} If the manifest, package name, author, optional string fields, or package-manager option is invalid.
 * @remarks The input manifest and nested author object are not mutated. This helper does not read files, environment variables, or package-manager configuration.
 * @category Util
 */
export function derivePackageMetadata(
  manifest: PackageManifest,
  options: DerivePackageMetadataOptions = {}
): DerivedPackageMetadata {
  if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new TypeError("manifest must be an object");
  }
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("options must be an object when provided");
  }

  const manifestRecord = manifest as unknown as Record<string, unknown>;
  if (typeof manifestRecord.name !== "string" || !manifestRecord.name.trim()) {
    throw new TypeError("manifest.name must be a non-empty string");
  }
  const name = manifestRecord.name.trim();
  const unscopedName = getUnscopedPackageName(name);
  const packageManager = options.packageManager ?? "npm";
  if (packageManager !== "npm" && packageManager !== "pnpm" && packageManager !== "yarn") {
    throw new TypeError("packageManager must be \"npm\", \"pnpm\", or \"yarn\"");
  }

  const installPrefix = packageManager === "npm"
    ? "npm install"
    : `${packageManager} add`;

  return {
    name,
    version: readOptionalManifestString(manifestRecord, "version"),
    description: readOptionalManifestString(manifestRecord, "description"),
    license: readOptionalManifestString(manifestRecord, "license"),
    author: normalizePackageAuthor(manifestRecord.author),
    unscopedName,
    iifeGlobal: toJavaScriptGlobalName(unscopedName),
    installCommand: `${installPrefix} ${name}`,
  };
}
