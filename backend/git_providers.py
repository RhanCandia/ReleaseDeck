import asyncio
import json
import os
import re
import ssl
import urllib.request
import urllib.error
import urllib.parse
from dataclasses import dataclass
from typing import Dict, List, Optional, Any

USER_AGENT = "ReleaseDeck-SteamDeck-Plugin/0.1.2"

LINUX_MATCH_KEYWORDS = [
    "linux", "x86_64", "x64", "amd64", "appimage", "steamdeck",
    "tar.gz", "tgz", "tar.xz"
]
NON_LINUX_KEYWORDS = [
    "win32", "win64", "windows", ".exe", ".msi", ".dmg", ".pkg",
    "darwin", "macos", "android", ".apk"
]

def get_ssl_context() -> ssl.SSLContext:
    """Create a verified SSL context with system CA paths, or fallback safely if SteamOS CA paths are missing."""
    ca_paths = [
        "/etc/ssl/certs/ca-certificates.crt",
        "/etc/pki/tls/certs/ca-bundle.crt",
        "/etc/ssl/ca-bundle.pem",
        "/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem",
    ]
    try:
        ctx = ssl.create_default_context()
        for ca_path in ca_paths:
            if os.path.exists(ca_path):
                try:
                    ctx.load_verify_locations(cafile=ca_path)
                    return ctx
                except Exception:
                    pass
        return ctx
    except Exception:
        return ssl._create_unverified_context()

def is_linux_recommended(asset_name: str) -> bool:
    """Determine if a release asset is suitable/recommended for Steam Deck / SteamOS."""
    name_lower = asset_name.lower()
    
    # Check if explicitly non-Linux
    if any(keyword in name_lower for keyword in NON_LINUX_KEYWORDS):
        return False
    
    # Check if it has Linux/Steam Deck indicators or archive extensions
    if any(keyword in name_lower for keyword in LINUX_MATCH_KEYWORDS):
        return True
        
    # Generic archives (.zip / .tar.gz / .tar.xz) without explicit OS tag may still be portable
    if name_lower.endswith(".zip") or name_lower.endswith(".tar.gz") or name_lower.endswith(".tar.xz"):
        return True
        
    return False

class GitProviderError(Exception):
    def __init__(self, message: str, status_code: Optional[int] = None, is_rate_limit: bool = False, provider: str = "git"):
        super().__init__(message)
        self.status_code = status_code
        self.is_rate_limit = is_rate_limit
        self.provider = provider

# Alias for backward compatibility
GitHubAPIError = GitProviderError

@dataclass
class ParsedRepo:
    raw_input: str
    host: str
    owner: str
    repo: str
    provider_type: str  # "github", "forgejo", "gitlab", "auto"
    display_name: str
    canonical_spec: str

def parse_repo_spec(raw_input: str) -> ParsedRepo:
    """
    Parses various repository spec formats:
    - Shorthand (defaults to GitHub): "shadps4-emu/shadPS4", "RhanCandia/ReleaseDeck"
    - Prefixed shorthand: "gitlab:inkscape/inkscape", "codeberg:forgejo/forgejo"
    - Full URL: "https://git.eden-emu.dev/eden-emu/eden", "https://github.com/owner/repo"
    - Domain path: "git.eden-emu.dev/eden-emu/eden", "codeberg.org/owner/repo"
    """
    raw = raw_input.strip()
    if not raw:
        raise GitProviderError("Repository identifier cannot be empty.")

    # 1. Check for explicit provider prefix: e.g. "gitlab:owner/repo", "codeberg:owner/repo", "itch:owner/game"
    if ":" in raw and not raw.startswith("http://") and not raw.startswith("https://"):
        prefix, rest = raw.split(":", 1)
        prefix = prefix.strip().lower()
        rest = rest.strip().strip("/")
        parts = [p for p in rest.split("/") if p]
        if len(parts) >= 2:
            owner = "/".join(parts[:-1])
            repo = parts[-1]
            if prefix in ("gh", "github"):
                return ParsedRepo(raw, "github.com", owner, repo, "github", repo, f"{owner}/{repo}")
            elif prefix in ("cb", "codeberg"):
                return ParsedRepo(raw, "codeberg.org", owner, repo, "forgejo", repo, f"codeberg.org/{owner}/{repo}")
            elif prefix in ("gl", "gitlab"):
                return ParsedRepo(raw, "gitlab.com", owner, repo, "gitlab", repo, f"gitlab.com/{owner}/{repo}")
            elif prefix in ("fj", "forgejo", "gitea"):
                return ParsedRepo(raw, "forgejo", owner, repo, "forgejo", repo, raw)
            elif prefix in ("itch", "itchio"):
                return ParsedRepo(raw, f"{owner}.itch.io", owner, repo, "itch", repo, f"{owner}.itch.io/{repo}")
        elif len(parts) == 1 and prefix in ("itch", "itchio"):
            repo = parts[0]
            return ParsedRepo(raw, "itch.io", "itch", repo, "itch", repo, f"itch.io/{repo}")

    # 2. Check for URL or domain path
    if raw.startswith("http://") or raw.startswith("https://"):
        parsed = urllib.parse.urlparse(raw)
        host = parsed.netloc.lower()
        path = parsed.path.strip("/")
    elif "/" in raw and ("." in raw.split("/")[0] or ":" in raw.split("/")[0]):
        # e.g. git.eden-emu.dev/eden-emu/eden or undreamedpanic.itch.io/gamma-emerald-ea
        first_segment, rest = raw.split("/", 1)
        host = first_segment.lower()
        path = rest.strip("/")
    else:
        # Standard shorthand owner/repo -> Default to GitHub
        cleaned = raw.strip("/")
        parts = [p for p in cleaned.split("/") if p]
        if len(parts) != 2:
            raise GitProviderError(f"Invalid repository format '{raw}'. Expected 'owner/repo' or full URL.")
        owner, repo = parts[0], parts[1]
        return ParsedRepo(raw, "github.com", owner, repo, "github", repo, f"{owner}/{repo}")

    # Remove any trailing .git or subpaths like /releases
    path = re.sub(r"\.git$", "", path)
    path = re.sub(r"/releases(/tag/.*)?$", "", path)
    path = re.sub(r"/src/branch/.*$", "", path)

    parts = [p for p in path.split("/") if p]

    # Special handling for itch.io URLs: https://<creator>.itch.io/<game>
    if host.endswith(".itch.io") or host == "itch.io":
        if host.endswith(".itch.io") and host != "itch.io":
            owner = host[:-8]  # Strip .itch.io
            repo = parts[0] if parts else "game"
        elif len(parts) >= 2:
            owner, repo = parts[0], parts[1]
            host = f"{owner}.itch.io"
        elif len(parts) == 1:
            owner, repo = "itch", parts[0]
        else:
            raise GitProviderError(f"Invalid itch.io game URL '{raw}'. Expected 'https://<creator>.itch.io/<game>'.")
        canonical = f"{owner}.itch.io/{repo}"
        return ParsedRepo(raw, host, owner, repo, "itch", repo, canonical)

    if len(parts) < 2:
        raise GitProviderError(f"Invalid repository URL path in '{raw}'. Expected at least owner and repo name.")

    owner = "/".join(parts[:-1])
    repo = parts[-1]

    # Detect provider type by known domain
    if host == "github.com" or host.endswith(".github.com"):
        provider_type = "github"
        canonical = f"{owner}/{repo}" if host == "github.com" else f"{host}/{owner}/{repo}"
    elif host == "codeberg.org" or "gitea" in host or "forgejo" in host or "eden-emu" in host:
        provider_type = "forgejo"
        canonical = f"{host}/{owner}/{repo}"
    elif host == "gitlab.com" or host.endswith(".gitlab.com") or "gitlab" in host:
        provider_type = "gitlab"
        canonical = f"{host}/{owner}/{repo}"
    else:
        provider_type = "auto"
        canonical = f"{host}/{owner}/{repo}"

    return ParsedRepo(raw, host, owner, repo, provider_type, repo, canonical)


class BaseGitProvider:
    def fetch_releases(self, parsed: ParsedRepo, token: Optional[str] = None) -> List[Dict[str, Any]]:
        raise NotImplementedError()


class GitHubProvider(BaseGitProvider):
    def fetch_releases(self, parsed: ParsedRepo, token: Optional[str] = None) -> List[Dict[str, Any]]:
        if parsed.host == "github.com":
            url = f"https://api.github.com/repos/{parsed.owner}/{parsed.repo}/releases?per_page=30"
        else:
            url = f"https://{parsed.host}/api/v3/repos/{parsed.owner}/{parsed.repo}/releases?per_page=30"

        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "application/vnd.github.v3+json"
        }
        if token and (parsed.host == "github.com" or not token.startswith("glpat-")):
            headers["Authorization"] = f"token {token}"

        req = urllib.request.Request(url, headers=headers)
        data = self._urlopen_json(req, parsed.canonical_spec, "GitHub")

        parsed_releases = []
        for rel in data:
            assets = []
            for asset in rel.get("assets", []):
                asset_name = asset.get("name", "")
                assets.append({
                    "id": asset.get("id"),
                    "name": asset_name,
                    "size": asset.get("size", 0),
                    "download_url": asset.get("browser_download_url"),
                    "content_type": asset.get("content_type", ""),
                    "download_count": asset.get("download_count", 0),
                    "is_recommended": is_linux_recommended(asset_name)
                })
            assets.sort(key=lambda a: (not a["is_recommended"], a["name"]))

            parsed_releases.append({
                "id": rel.get("id"),
                "tag_name": rel.get("tag_name", ""),
                "name": rel.get("name") or rel.get("tag_name", ""),
                "prerelease": rel.get("prerelease", False),
                "draft": rel.get("draft", False),
                "published_at": rel.get("published_at") or rel.get("created_at", ""),
                "body": rel.get("body", ""),
                "html_url": rel.get("html_url", ""),
                "assets": assets
            })
        return parsed_releases

    def _urlopen_json(self, req: urllib.request.Request, repo_str: str, provider_name: str) -> Any:
        try:
            try:
                response = urllib.request.urlopen(req, timeout=15, context=get_ssl_context())
            except urllib.error.URLError as url_err:
                if "CERTIFICATE_VERIFY_FAILED" in str(url_err):
                    unverified_ctx = ssl._create_unverified_context()
                    response = urllib.request.urlopen(req, timeout=15, context=unverified_ctx)
                else:
                    raise url_err

            with response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            remaining = e.headers.get("x-ratelimit-remaining", "1")
            is_rate_limit = (e.code == 403 and remaining == "0") or "rate limit" in str(e).lower()
            if is_rate_limit:
                raise GitProviderError(
                    f"{provider_name} API rate limit exceeded. Please add a Personal Access Token in Settings.",
                    status_code=403,
                    is_rate_limit=True,
                    provider=provider_name.lower()
                )
            elif e.code == 404:
                raise GitProviderError(f"Repository '{repo_str}' not found on {provider_name}.", status_code=404, provider=provider_name.lower())
            else:
                raise GitProviderError(f"{provider_name} API Error: {e.code} {e.reason}", status_code=e.code, provider=provider_name.lower())
        except urllib.error.URLError as e:
            raise GitProviderError(f"Network connection failed: {e.reason}", provider=provider_name.lower())
        except GitProviderError:
            raise
        except Exception as e:
            raise GitProviderError(f"Unexpected error querying {provider_name}: {str(e)}", provider=provider_name.lower())


class GiteaForgejoProvider(BaseGitProvider):
    """Handles Forgejo, Gitea, and Codeberg release endpoints."""
    def fetch_releases(self, parsed: ParsedRepo, token: Optional[str] = None) -> List[Dict[str, Any]]:
        url = f"https://{parsed.host}/api/v1/repos/{parsed.owner}/{parsed.repo}/releases?limit=30"
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "application/json"
        }
        if token and (token.startswith("gitea_") or len(token) == 40):
            headers["Authorization"] = f"token {token}"

        req = urllib.request.Request(url, headers=headers)
        data = self._urlopen_json(req, parsed.canonical_spec, "Forgejo/Gitea")

        parsed_releases = []
        for rel in data:
            assets = []
            for asset in rel.get("assets", []):
                asset_name = asset.get("name", "")
                download_url = asset.get("browser_download_url") or ""
                if download_url.startswith("/"):
                    download_url = f"https://{parsed.host}{download_url}"

                assets.append({
                    "id": asset.get("id"),
                    "name": asset_name,
                    "size": asset.get("size", 0),
                    "download_url": download_url,
                    "content_type": "",
                    "download_count": asset.get("download_count", 0),
                    "is_recommended": is_linux_recommended(asset_name)
                })
            assets.sort(key=lambda a: (not a["is_recommended"], a["name"]))

            html_url = rel.get("html_url") or f"https://{parsed.host}/{parsed.owner}/{parsed.repo}/releases/tag/{rel.get('tag_name')}"

            parsed_releases.append({
                "id": rel.get("id"),
                "tag_name": rel.get("tag_name", ""),
                "name": rel.get("name") or rel.get("tag_name", ""),
                "prerelease": rel.get("prerelease", False),
                "draft": rel.get("draft", False),
                "published_at": rel.get("published_at") or rel.get("created_at", ""),
                "body": rel.get("body", ""),
                "html_url": html_url,
                "assets": assets
            })
        return parsed_releases

    def _urlopen_json(self, req: urllib.request.Request, repo_str: str, provider_name: str) -> Any:
        try:
            try:
                response = urllib.request.urlopen(req, timeout=15, context=get_ssl_context())
            except urllib.error.URLError as url_err:
                if "CERTIFICATE_VERIFY_FAILED" in str(url_err):
                    unverified_ctx = ssl._create_unverified_context()
                    response = urllib.request.urlopen(req, timeout=15, context=unverified_ctx)
                else:
                    raise url_err

            with response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise GitProviderError(f"Repository '{repo_str}' not found on {provider_name}.", status_code=404, provider="forgejo")
            else:
                raise GitProviderError(f"{provider_name} API Error: {e.code} {e.reason}", status_code=e.code, provider="forgejo")
        except urllib.error.URLError as e:
            raise GitProviderError(f"Network connection failed: {e.reason}", provider="forgejo")
        except GitProviderError:
            raise
        except Exception as e:
            raise GitProviderError(f"Unexpected error querying {provider_name}: {str(e)}", provider="forgejo")


class GitLabProvider(BaseGitProvider):
    """Handles GitLab.com and self-hosted GitLab instances."""
    def fetch_releases(self, parsed: ParsedRepo, token: Optional[str] = None) -> List[Dict[str, Any]]:
        project_path = urllib.parse.quote(f"{parsed.owner}/{parsed.repo}", safe="")
        url = f"https://{parsed.host}/api/v4/projects/{project_path}/releases?per_page=30"
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "application/json"
        }
        if token:
            headers["PRIVATE-TOKEN"] = token

        req = urllib.request.Request(url, headers=headers)
        data = self._urlopen_json(req, parsed.canonical_spec, "GitLab")

        parsed_releases = []
        for idx, rel in enumerate(data):
            assets = []
            rel_assets = rel.get("assets", {})
            for link in rel_assets.get("links", []):
                link_name = link.get("name", "")
                link_url = link.get("direct_asset_url") or link.get("url") or ""
                assets.append({
                    "id": link.get("id") or idx * 1000 + len(assets),
                    "name": link_name,
                    "size": 0,
                    "download_url": link_url,
                    "content_type": link.get("link_type", ""),
                    "download_count": 0,
                    "is_recommended": is_linux_recommended(link_name)
                })
            assets.sort(key=lambda a: (not a["is_recommended"], a["name"]))

            parsed_releases.append({
                "id": rel.get("tag_name") or idx,
                "tag_name": rel.get("tag_name", ""),
                "name": rel.get("name") or rel.get("tag_name", ""),
                "prerelease": False,
                "draft": False,
                "published_at": rel.get("released_at") or rel.get("created_at", ""),
                "body": rel.get("description", ""),
                "html_url": rel.get("_links", {}).get("self", f"https://{parsed.host}/{parsed.owner}/{parsed.repo}/-/releases"),
                "assets": assets
            })
        return parsed_releases

    def _urlopen_json(self, req: urllib.request.Request, repo_str: str, provider_name: str) -> Any:
        try:
            try:
                response = urllib.request.urlopen(req, timeout=15, context=get_ssl_context())
            except urllib.error.URLError as url_err:
                if "CERTIFICATE_VERIFY_FAILED" in str(url_err):
                    unverified_ctx = ssl._create_unverified_context()
                    response = urllib.request.urlopen(req, timeout=15, context=unverified_ctx)
                else:
                    raise url_err

            with response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise GitProviderError(f"Repository '{repo_str}' not found on GitLab.", status_code=404, provider="gitlab")
            else:
                raise GitProviderError(f"GitLab API Error: {e.code} {e.reason}", status_code=e.code, provider="gitlab")
        except urllib.error.URLError as e:
            raise GitProviderError(f"Network connection failed: {e.reason}", provider="gitlab")
        except GitProviderError:
            raise
        except Exception as e:
            raise GitProviderError(f"Unexpected error querying GitLab: {str(e)}", provider="gitlab")


class ItchProvider(BaseGitProvider):
    """Handles itch.io game page scraping and temporary signed CDN download URL resolution for free games."""
    def __init__(self):
        import http.cookiejar
        self.cj = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cj),
            urllib.request.HTTPSHandler(context=get_ssl_context())
        )

    def _get_headers(self, referer: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
        if referer:
            headers["Referer"] = referer
        return headers

    def _parse_size_str(self, s: str) -> int:
        s = s.strip().upper()
        m = re.match(r"^([\d\.]+)\s*([KMGTP]?B?)$", s)
        if not m:
            return 0
        val = float(m.group(1))
        unit = m.group(2)
        multipliers = {
            "B": 1,
            "KB": 1024,
            "K": 1024,
            "MB": 1024**2,
            "M": 1024**2,
            "GB": 1024**3,
            "G": 1024**3,
            "TB": 1024**4,
            "T": 1024**4
        }
        return int(val * multipliers.get(unit, 1))

    def fetch_releases(self, parsed: ParsedRepo, token: Optional[str] = None) -> List[Dict[str, Any]]:
        page_url = f"https://{parsed.host}/{parsed.repo}"
        req = urllib.request.Request(page_url, headers=self._get_headers())

        try:
            try:
                response = self.opener.open(req, timeout=15)
            except urllib.error.URLError as url_err:
                if "CERTIFICATE_VERIFY_FAILED" in str(url_err):
                    unverified_ctx = ssl._create_unverified_context()
                    unverified_opener = urllib.request.build_opener(
                        urllib.request.HTTPCookieProcessor(self.cj),
                        urllib.request.HTTPSHandler(context=unverified_ctx)
                    )
                    response = unverified_opener.open(req, timeout=15)
                else:
                    raise url_err

            with response:
                html = response.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise GitProviderError(f"Game '{parsed.canonical_spec}' not found on itch.io.", status_code=404, provider="itch")
            else:
                raise GitProviderError(f"itch.io Error: {e.code} {e.reason}", status_code=e.code, provider="itch")
        except GitProviderError:
            raise
        except Exception as e:
            raise GitProviderError(f"Failed to fetch game from itch.io: {str(e)}", provider="itch")

        # Parse title
        title_m = re.search(r"<h1[^>]*class=[\x22\x27]game_title[^\x22\x27]*[\x22\x27][^>]*>(.*?)</h1>", html, re.DOTALL)
        title = title_m.group(1).strip() if title_m else parsed.repo

        # Parse description / changelog
        desc_m = re.search(r"<div[^>]*class=[\x22\x27]formatted_description[^\x22\x27]*[\x22\x27][^>]*>(.*?)</div>", html, re.DOTALL)
        body = ""
        if desc_m:
            body = re.sub(r"<br\s*/?>", "\n", desc_m.group(1))
            body = re.sub(r"<[^>]+>", "", body).strip()
            lines = [l.strip() for l in body.splitlines() if l.strip()]
            body = "\n".join(lines[:20])

        # Parse uploads
        # Split by upload widgets
        upload_chunks = re.split(r"<div[^>]*class=[\x22\x27]upload(?:\s+[^\x22\x27]*)?[\x22\x27]", html)[1:]

        assets = []
        latest_version = "Latest"
        latest_date = ""

        for chunk in upload_chunks:
            # Keep up to next major widget
            clean_chunk = re.split(r"<div id=[\x22\x27]game_comments|<div class=[\x22\x27]view_game_page|<div class=[\x22\x27]base_widget", chunk)[0]
            up_id_m = re.search(r"data-upload_id=[\x22\x27](\d+)[\x22\x27]", clean_chunk)
            if not up_id_m:
                continue
            upload_id = int(up_id_m.group(1))

            name_m = re.search(r"<strong[^>]*class=[\x22\x27][^\x22\x27]*name[^\x22\x27]*[\x22\x27][^>]*>(.*?)</strong>", clean_chunk, re.DOTALL)
            name = ""
            if name_m:
                title_attr_m = re.search(r"title=[\x22\x27]([^\x22\x27]+)[\x22\x27]", name_m.group(0))
                if title_attr_m:
                    name = title_attr_m.group(1).strip()
                else:
                    name = re.sub(r"<[^>]+>", "", name_m.group(1)).strip()
            if not name:
                name = f"upload_{upload_id}"

            size_m = re.search(r"<span[^>]*class=[\x22\x27][^\x22\x27]*file_size[^\x22\x27]*[\x22\x27][^>]*>(.*?)</span>", clean_chunk, re.DOTALL)
            size_raw = re.sub(r"<[^>]+>", "", size_m.group(1)).strip() if size_m else ""
            size_bytes = self._parse_size_str(size_raw)

            ver_m = re.search(r"<span[^>]*class=[\x22\x27][^\x22\x27]*version_name[^\x22\x27]*[\x22\x27][^>]*>(.*?)</span>", clean_chunk, re.DOTALL)
            ver_name = re.sub(r"<[^>]+>", "", ver_m.group(1)).strip() if ver_m else ""
            if ver_name and latest_version == "Latest":
                latest_version = ver_name

            date_m = re.search(r"<abbr[^>]*title=[\x22\x27]([^\x22\x27]+)[\x22\x27]", clean_chunk)
            date_str = date_m.group(1) if date_m else ""
            if date_str and not latest_date:
                latest_date = date_str

            plat_m = re.findall(r"title=[\x22\x27]Download for ([^\x22\x27]+)[\x22\x27]", clean_chunk)
            platforms = [p.lower() for p in plat_m]

            is_rec = False
            if "linux" in platforms:
                is_rec = True
            elif "windows" in platforms or "macos" in platforms or "android" in platforms:
                is_rec = False
            else:
                is_rec = is_linux_recommended(name)

            download_url = f"{page_url}/file/{upload_id}"

            assets.append({
                "id": upload_id,
                "name": name,
                "size": size_bytes,
                "download_url": download_url,
                "content_type": "application/octet-stream",
                "download_count": 0,
                "is_recommended": is_rec
            })

        if not assets:
            raise GitProviderError(
                f"No free downloadable files found on itch.io page '{parsed.canonical_spec}'. "
                "Paid games or games requiring login are not currently downloadable without an active session.",
                provider="itch"
            )

        if not any(a["is_recommended"] for a in assets):
            assets[0]["is_recommended"] = True

        assets.sort(key=lambda a: (not a["is_recommended"], a["name"]))

        return [{
            "id": 1,
            "tag_name": latest_version,
            "name": f"{title} ({latest_version})",
            "prerelease": False,
            "draft": False,
            "published_at": latest_date,
            "body": body,
            "html_url": page_url,
            "assets": assets
        }]

    def resolve_download_url(self, file_url: str) -> str:
        """Resolve itch.io /file/<upload_id> link into a temporary signed direct CDN download URL."""
        parsed = urllib.parse.urlparse(file_url)
        page_url = f"https://{parsed.netloc}{parsed.path.rsplit('/file/', 1)[0]}"

        # 1. Fetch game page to establish session cookies and fresh CSRF
        req = urllib.request.Request(page_url, headers=self._get_headers())
        with self.opener.open(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="replace")

        csrf_m = (
            re.search(r"[\x22\x27]csrf_token[\x22\x27]\s*:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]", html) or
            re.search(r"name=[\x22\x27]csrf_token[\x22\x27]\s+value=[\x22\x27]([^\x22\x27]+)[\x22\x27]", html) or
            re.search(r"csrf_token\s*[:=]\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]", html) or
            re.search(r"I\.set_csrf_token\([\x22\x27]([^\x22\x27]+)[\x22\x27]\)", html)
        )
        csrf_token = csrf_m.group(1) if csrf_m else ""

        # 2. POST to file endpoint
        post_data = urllib.parse.urlencode({"csrf_token": csrf_token}).encode("utf-8")
        post_headers = {
            **self._get_headers(referer=page_url),
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        }
        post_req = urllib.request.Request(file_url, data=post_data, headers=post_headers)

        with self.opener.open(post_req, timeout=15) as post_resp:
            data = json.loads(post_resp.read().decode("utf-8"))
            cdn_url = data.get("url")
            if not cdn_url:
                raise GitProviderError("itch.io did not return a valid download URL.", provider="itch")
            return cdn_url


class UnifiedGitClient:
    """Unified client orchestrating multiple Git forges and itch.io with GitHub as the default."""
    def __init__(self, github_token: Optional[str] = None):
        self.github_token = github_token.strip() if github_token else None
        self.github_provider = GitHubProvider()
        self.forgejo_provider = GiteaForgejoProvider()
        self.gitlab_provider = GitLabProvider()
        self.itch_provider = ItchProvider()

    def set_token(self, token: Optional[str]) -> None:
        self.github_token = token.strip() if token else None

    def resolve_download_url(self, url: str) -> str:
        """Resolves dynamic signed URLs (e.g. itch.io temporary CDN links) if applicable."""
        if ".itch.io" in url and "/file/" in url:
            return self.itch_provider.resolve_download_url(url)
        return url

    def _sync_fetch_releases(self, repo_spec: str) -> List[Dict[str, Any]]:
        parsed = parse_repo_spec(repo_spec)

        if parsed.provider_type == "github":
            return self.github_provider.fetch_releases(parsed, self.github_token)
        elif parsed.provider_type == "forgejo":
            return self.forgejo_provider.fetch_releases(parsed, self.github_token)
        elif parsed.provider_type == "gitlab":
            return self.gitlab_provider.fetch_releases(parsed, self.github_token)
        elif parsed.provider_type == "itch":
            return self.itch_provider.fetch_releases(parsed, self.github_token)
        else:
            # Auto-probe custom domain: Try Forgejo/Gitea first, then GitLab, then GitHub API
            last_err = None
            try:
                return self.forgejo_provider.fetch_releases(parsed, self.github_token)
            except GitProviderError as e:
                last_err = e

            try:
                return self.gitlab_provider.fetch_releases(parsed, self.github_token)
            except GitProviderError:
                pass

            try:
                return self.github_provider.fetch_releases(parsed, self.github_token)
            except GitProviderError:
                pass

            if last_err:
                raise last_err
            raise GitProviderError(f"Could not resolve releases from custom host '{parsed.host}'.")

    async def fetch_releases(self, repo_spec: str) -> List[Dict[str, Any]]:
        return await asyncio.to_thread(self._sync_fetch_releases, repo_spec)

# Compatibility alias for existing codebase
class GitHubClient(UnifiedGitClient):
    pass
