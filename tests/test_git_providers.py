import unittest
import sys
import os
import json
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

if __name__ == "__main__":
    unittest.main()
