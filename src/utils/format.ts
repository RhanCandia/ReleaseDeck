export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(isoString: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return isoString;
  }
}

export interface ParsedRepoInfo {
  host: string;
  owner: string;
  repo: string;
  providerType: "github" | "forgejo" | "gitlab" | "custom";
  displayName: string;
  subtitle: string;
  canonical: string;
}

export function parseRepoSpec(rawInput: string): ParsedRepoInfo {
  const raw = (rawInput || "").trim();
  if (!raw) {
    return {
      host: "github.com",
      owner: "",
      repo: "Unknown",
      providerType: "github",
      displayName: "Unknown",
      subtitle: "",
      canonical: "",
    };
  }

  // Handle provider prefix e.g. gitlab:user/repo, codeberg:user/repo
  if (raw.includes(":") && !raw.startsWith("http://") && !raw.startsWith("https://")) {
    const [prefix, rest] = raw.split(":", 2);
    const p = prefix.trim().toLowerCase();
    const parts = rest.split("/").map((s) => s.trim()).filter(Boolean);
    const repoName = parts[parts.length - 1] || rest;
    const ownerName = parts.slice(0, -1).join("/");

    if (p === "gl" || p === "gitlab") {
      return {
        host: "gitlab.com",
        owner: ownerName,
        repo: repoName,
        providerType: "gitlab",
        displayName: repoName,
        subtitle: `GitLab • ${ownerName}`,
        canonical: `gitlab.com/${ownerName}/${repoName}`,
      };
    } else if (p === "cb" || p === "codeberg") {
      return {
        host: "codeberg.org",
        owner: ownerName,
        repo: repoName,
        providerType: "forgejo",
        displayName: repoName,
        subtitle: `Codeberg • ${ownerName}`,
        canonical: `codeberg.org/${ownerName}/${repoName}`,
      };
    }
  }

  let host = "github.com";
  let path = raw;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const url = new URL(raw);
      host = url.hostname.toLowerCase();
      path = url.pathname.replace(/^\/+/, "");
    } catch {
      // Fallback
    }
  } else if (raw.includes("/") && (raw.split("/")[0].includes(".") || raw.split("/")[0].includes(":"))) {
    const firstSlash = raw.indexOf("/");
    host = raw.slice(0, firstSlash).toLowerCase();
    path = raw.slice(firstSlash + 1);
  }

  // Clean trailing .git and releases path
  path = path.replace(/\.git$/, "").replace(/\/releases(\/tag\/.*)?$/, "").replace(/\/src\/branch\/.*$/, "");
  const parts = path.split("/").map((s) => s.trim()).filter(Boolean);

  if (parts.length === 0) {
    return {
      host,
      owner: "",
      repo: raw,
      providerType: "github",
      displayName: raw,
      subtitle: host,
      canonical: raw,
    };
  }

  const repoName = parts[parts.length - 1];
  const ownerName = parts.slice(0, -1).join("/") || "";

  let providerType: "github" | "forgejo" | "gitlab" | "custom" = "custom";
  let subtitle = `${host} • ${ownerName}`;

  if (host === "github.com" || host.endsWith(".github.com")) {
    providerType = "github";
    subtitle = ownerName ? `GitHub • ${ownerName}` : "GitHub";
  } else if (host === "codeberg.org" || host.includes("gitea") || host.includes("forgejo") || host.includes("eden-emu")) {
    providerType = "forgejo";
    const hostLabel = host === "codeberg.org" ? "Codeberg" : host;
    subtitle = `${hostLabel} • ${ownerName}`;
  } else if (host === "gitlab.com" || host.includes("gitlab")) {
    providerType = "gitlab";
    subtitle = `GitLab • ${ownerName}`;
  }

  const canonical = host === "github.com" ? `${ownerName}/${repoName}` : `${host}/${ownerName}/${repoName}`;

  return {
    host,
    owner: ownerName,
    repo: repoName,
    providerType,
    displayName: repoName,
    subtitle,
    canonical,
  };
}
