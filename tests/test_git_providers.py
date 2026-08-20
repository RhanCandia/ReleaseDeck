import unittest
import sys
import os
import json
import urllib.request
from unittest.mock import patch, MagicMock

# Include project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import tests.mock_decky  # noqa: F401

from backend.git_providers import (
    parse_repo_spec,
    UnifiedGitClient,
    GitHubClient,
    GitHubAPIError,
    GitProviderError,
    is_linux_recommended,
    GitHubProvider,
    GiteaForgejoProvider,
    GitLabProvider,
)

class TestGitProviders(unittest.IsolatedAsyncioTestCase):
    def test_parse_repo_spec_github_default(self):
        # Shorthand should default to GitHub
        parsed = parse_repo_spec("shadps4-emu/shadPS4")
        self.assertEqual(parsed.host, "github.com")
        self.assertEqual(parsed.owner, "shadps4-emu")
        self.assertEqual(parsed.repo, "shadPS4")
        self.assertEqual(parsed.provider_type, "github")
        self.assertEqual(parsed.canonical_spec, "shadps4-emu/shadPS4")
        self.assertEqual(parsed.display_name, "shadPS4")

    def test_parse_repo_spec_github_url(self):
        parsed = parse_repo_spec("https://github.com/RhanCandia/ReleaseDeck")
        self.assertEqual(parsed.host, "github.com")
        self.assertEqual(parsed.owner, "RhanCandia")
        self.assertEqual(parsed.repo, "ReleaseDeck")
        self.assertEqual(parsed.provider_type, "github")
        self.assertEqual(parsed.canonical_spec, "RhanCandia/ReleaseDeck")

    def test_parse_repo_spec_forgejo_custom_domain(self):
        # Full URL
        parsed = parse_repo_spec("https://git.eden-emu.dev/eden-emu/eden")
        self.assertEqual(parsed.host, "git.eden-emu.dev")
        self.assertEqual(parsed.owner, "eden-emu")
        self.assertEqual(parsed.repo, "eden")
        self.assertEqual(parsed.provider_type, "forgejo")
        self.assertEqual(parsed.canonical_spec, "git.eden-emu.dev/eden-emu/eden")
        self.assertEqual(parsed.display_name, "eden")

        # Domain path without scheme
        parsed2 = parse_repo_spec("git.eden-emu.dev/eden-emu/eden")
        self.assertEqual(parsed2.host, "git.eden-emu.dev")
        self.assertEqual(parsed2.owner, "eden-emu")
        self.assertEqual(parsed2.repo, "eden")
        self.assertEqual(parsed2.provider_type, "forgejo")

        # With trailing /releases or .git
        parsed3 = parse_repo_spec("https://git.eden-emu.dev/eden-emu/eden/releases/tag/v0.2.1")
        self.assertEqual(parsed3.repo, "eden")
        self.assertEqual(parsed3.owner, "eden-emu")

    def test_parse_repo_spec_codeberg_and_gitlab(self):
        # Codeberg URL
        parsed_cb = parse_repo_spec("https://codeberg.org/forgejo/forgejo")
        self.assertEqual(parsed_cb.host, "codeberg.org")
        self.assertEqual(parsed_cb.provider_type, "forgejo")
        self.assertEqual(parsed_cb.repo, "forgejo")

        # GitLab URL
        parsed_gl = parse_repo_spec("https://gitlab.com/inkscape/inkscape")
        self.assertEqual(parsed_gl.host, "gitlab.com")
        self.assertEqual(parsed_gl.provider_type, "gitlab")
        self.assertEqual(parsed_gl.repo, "inkscape")

        # Prefixes
        parsed_gl_pre = parse_repo_spec("gitlab:inkscape/inkscape")
        self.assertEqual(parsed_gl_pre.host, "gitlab.com")
        self.assertEqual(parsed_gl_pre.provider_type, "gitlab")

        parsed_cb_pre = parse_repo_spec("codeberg:forgejo/forgejo")
        self.assertEqual(parsed_cb_pre.host, "codeberg.org")
        self.assertEqual(parsed_cb_pre.provider_type, "forgejo")

    def test_invalid_repo_specs(self):
        with self.assertRaises(GitProviderError):
            parse_repo_spec("")
        with self.assertRaises(GitProviderError):
            parse_repo_spec("justoneword")

    def test_linux_recommendation(self):
        self.assertTrue(is_linux_recommended("Eden-Linux-v0.2.1-steamdeck-gcc-standard.AppImage"))
        self.assertTrue(is_linux_recommended("App-amd64.AppImage"))
        self.assertTrue(is_linux_recommended("tool-linux-x86_64.tar.gz"))
        self.assertFalse(is_linux_recommended("Eden-Android-v0.2.1.apk"))
        self.assertFalse(is_linux_recommended("Eden-Windows-v0.2.1.exe"))

    @patch("urllib.request.urlopen")
    async def test_forgejo_provider_mock(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps([
            {
                "id": 101,
                "tag_name": "v0.2.1",
                "name": "Eden v0.2.1",
                "body": "Changelog for Eden",
                "prerelease": False,
                "draft": False,
                "created_at": "2026-06-01T19:57:41Z",
                "html_url": "https://git.eden-emu.dev/eden-emu/eden/releases/tag/v0.2.1",
                "assets": [
                    {
                        "id": 4791,
                        "name": "Eden-Linux-v0.2.1-steamdeck-gcc-standard.AppImage",
                        "size": 84000000,
                        "browser_download_url": "https://stable.eden-emu.dev/v0.2.1/Eden-Linux-v0.2.1-steamdeck-gcc-standard.AppImage",
                        "download_count": 42
                    },
                    {
                        "id": 4792,
                        "name": "Eden-Windows-v0.2.1.exe",
                        "size": 75000000,
                        "browser_download_url": "https://stable.eden-emu.dev/v0.2.1/Eden-Windows-v0.2.1.exe",
                        "download_count": 10
                    }
                ]
            }
        ]).encode("utf-8")
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        client = UnifiedGitClient()
        releases = await client.fetch_releases("https://git.eden-emu.dev/eden-emu/eden")
        self.assertEqual(len(releases), 1)
        rel = releases[0]
        self.assertEqual(rel["tag_name"], "v0.2.1")
        self.assertEqual(rel["name"], "Eden v0.2.1")
        self.assertEqual(len(rel["assets"]), 2)
        # Steam Deck AppImage should be recommended and sorted first
        self.assertTrue(rel["assets"][0]["is_recommended"])
        self.assertEqual(rel["assets"][0]["name"], "Eden-Linux-v0.2.1-steamdeck-gcc-standard.AppImage")
        self.assertFalse(rel["assets"][1]["is_recommended"])

    def test_parse_repo_spec_itch(self):
        # Demo URL from user
        parsed = parse_repo_spec("https://undreamedpanic.itch.io/gamma-emerald-ea")
        self.assertEqual(parsed.host, "undreamedpanic.itch.io")
        self.assertEqual(parsed.owner, "undreamedpanic")
        self.assertEqual(parsed.repo, "gamma-emerald-ea")
        self.assertEqual(parsed.provider_type, "itch")
        self.assertEqual(parsed.canonical_spec, "undreamedpanic.itch.io/gamma-emerald-ea")
        self.assertEqual(parsed.display_name, "gamma-emerald-ea")

        # Shorthand without scheme
        parsed2 = parse_repo_spec("undreamedpanic.itch.io/gamma-emerald-ea")
        self.assertEqual(parsed2.host, "undreamedpanic.itch.io")
        self.assertEqual(parsed2.owner, "undreamedpanic")
        self.assertEqual(parsed2.repo, "gamma-emerald-ea")
        self.assertEqual(parsed2.provider_type, "itch")

        # Prefixed shorthand
        parsed3 = parse_repo_spec("itch:undreamedpanic/gamma-emerald-ea")
        self.assertEqual(parsed3.host, "undreamedpanic.itch.io")
        self.assertEqual(parsed3.owner, "undreamedpanic")
        self.assertEqual(parsed3.repo, "gamma-emerald-ea")
        self.assertEqual(parsed3.provider_type, "itch")

    def test_itch_provider_mock_gamma_emerald_ea(self):
        mock_html = """
        <html>
        <h1 class="game_title">Gamma Emerald - EA</h1>
        <div class="formatted_description">Exciting Pokemon Emerald enhancement romhack build.</div>
        <script>I.set_csrf_token("test_csrf_token_12345");</script>
        <div class="upload_list_widget base_widget">
            <div class="upload">
                <a data-upload_id="18807325" class="button download_btn" href="javascript:void(0);">Download</a>
                <div class="info_column">
                    <div class="upload_name">
                        <strong title="gamma-emerald-ea-windows.zip" class="name">gamma-emerald-ea-windows.zip</strong>
                        <span class="file_size"><span>1.3 GB</span></span>
                        <span class="download_platforms"><span title="Download for Windows" class="icon icon-windows8"></span></span>
                    </div>
                    <div class="build_row">
                        <span class="version_name">Version 1.12.1</span>
                        <span class="version_date"><abbr title="19 August 2026 @ 09:51 UTC">20 hours ago</abbr></span>
                    </div>
                </div>
            </div>
        </div>
        </html>
        """
        client = UnifiedGitClient()
        mock_page_resp = MagicMock()
        mock_page_resp.read.return_value = mock_html.encode("utf-8")
        mock_page_resp.__enter__.return_value = mock_page_resp

        mock_post_resp = MagicMock()
        mock_post_resp.read.return_value = json.dumps({
            "url": "https://itchio-mirror.r2.cloudflarestorage.com/build/1896370/gamma-emerald-ea-windows.zip?token=signed123"
        }).encode("utf-8")
        mock_post_resp.__enter__.return_value = mock_post_resp

        with patch.object(client.itch_provider.opener, "open", side_effect=[mock_page_resp, mock_page_resp, mock_post_resp]):
            releases = client._sync_fetch_releases("https://undreamedpanic.itch.io/gamma-emerald-ea")
            self.assertEqual(len(releases), 1)
            rel = releases[0]
            self.assertEqual(rel["tag_name"], "Version 1.12.1")
            self.assertEqual(rel["name"], "Gamma Emerald - EA (Version 1.12.1)")
            self.assertEqual(len(rel["assets"]), 1)
            asset = rel["assets"][0]
            self.assertEqual(asset["id"], 18807325)
            self.assertEqual(asset["name"], "gamma-emerald-ea-windows.zip")
            self.assertEqual(asset["size"], int(1.3 * (1024**3)))
            self.assertEqual(asset["download_url"], "https://undreamedpanic.itch.io/gamma-emerald-ea/file/18807325")

            resolved = client.resolve_download_url(asset["download_url"])
            self.assertTrue(resolved.startswith("https://itchio-mirror.r2.cloudflarestorage.com/"))

    def test_live_itch_gamma_emerald_ea(self):
        """Live network test fetching the user's real demo URL."""
        client = UnifiedGitClient()
        try:
            releases = client._sync_fetch_releases("https://undreamedpanic.itch.io/gamma-emerald-ea")
            self.assertTrue(len(releases) >= 1)
            rel = releases[0]
            self.assertIn("Gamma Emerald", rel["name"])
            self.assertTrue(len(rel["assets"]) >= 1)
            asset = rel["assets"][0]
            self.assertIn("gamma-emerald", asset["name"].lower())
            self.assertTrue(asset["download_url"].endswith("/18807325") or "/file/" in asset["download_url"])

            # Test live resolution of the direct signed CDN URL
            cdn_url = client.resolve_download_url(asset["download_url"])
            self.assertTrue(cdn_url.startswith("https://"))
            self.assertIn("r2.cloudflarestorage.com", cdn_url)

            # Test actual binary download stream
            req = urllib.request.Request(cdn_url, headers={"User-Agent": "ReleaseDeck-SteamDeck-Plugin/0.2.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                self.assertEqual(resp.status, 200)
                self.assertEqual(resp.headers.get("Content-Type"), "application/octet-stream")
                chunk = resp.read(64 * 1024)
                self.assertTrue(len(chunk) > 0)
                # Verify valid ZIP header (PK\x03\x04)
                self.assertTrue(chunk.startswith(b"PK\x03\x04"))
        except Exception as e:
            # If running in environment without internet, don't fail unit tests
            if "Network connection failed" in str(e) or "Name or service not known" in str(e):
                self.skipTest(f"Network unavailable for live itch test: {e}")
            else:
                raise e

if __name__ == "__main__":
    unittest.main()
