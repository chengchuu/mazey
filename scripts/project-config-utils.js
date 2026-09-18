function javaScriptGlobal(value) {
  const identifier = value.replace(/[^A-Za-z0-9_$]/g, "_");
  return /^[A-Za-z_$]/.test(identifier) ? identifier : `_${identifier}`;
}

function packageDetails(pkg) {
  if (typeof pkg.name !== "string" || !pkg.name.trim()) {
    throw new Error("package.json must define a package name");
  }

  const bundleBaseName = pkg.name.split("/").filter(Boolean).at(-1);
  const author =
    typeof pkg.author === "string"
      ? { name: pkg.author }
      : pkg.author && typeof pkg.author === "object"
      ? { ...pkg.author }
      : { name: "" };

  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    license: pkg.license,
    author,
    bundleBaseName,
    iifeGlobal: javaScriptGlobal(bundleBaseName),
    installCommand: `npm install ${pkg.name}`,
  };
}

function repositoryDetails(repository) {
  const rawUrl = typeof repository === "string" ? repository : repository?.url;
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    throw new Error("package.json must define a GitHub repository URL");
  }

  const raw = rawUrl.trim();
  const shorthand = raw.match(
    /^(?:github:)?([^/:@\s]+)\/([^/\s]+?)(?:\.git)?$/i
  );
  const scp = raw.match(
    /^(?:git@)?github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i
  );
  let owner;
  let name;

  if (shorthand || scp) {
    [, owner, name] = shorthand || scp;
  } else {
    let parsed;
    try {
      parsed = new URL(raw.replace(/^git\+/, ""));
    } catch {
      throw new Error(
        `Cannot derive GitHub repository identity from ${rawUrl}`
      );
    }
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (hostname !== "github.com" || parts.length !== 2) {
      throw new Error(`Expected a GitHub repository URL, received ${rawUrl}`);
    }
    [owner, name] = parts;
    name = name.replace(/\.git$/i, "");
  }

  if (!owner || !name) {
    throw new Error(`Cannot derive GitHub repository identity from ${rawUrl}`);
  }
  return {
    name,
    owner,
    slug: `${owner}/${name}`,
    url: `https://github.com/${owner}/${name}`,
  };
}

module.exports = {
  javaScriptGlobal,
  packageDetails,
  repositoryDetails,
};
