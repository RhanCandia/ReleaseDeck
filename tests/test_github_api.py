import unittest
import sys
import os

# Include project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import tests.mock_decky  # noqa: F401

from backend.github_api import GitHubClient, is_linux_recommended, GitHubAPIError

class TestGitHubAPI(unittest.IsolatedAsyncioTestCase):
    def test_linux_recommendation_filtering(self):
        # Recommended assets
        self.assertTrue(is_linux_recommended("game-linux-x64.tar.gz"))
        self.assertTrue(is_linux_recommended("app-x86_64.AppImage"))
        self.assertTrue(is_linux_recommended("release-linux.zip"))
        self.assertTrue(is_linux_recommended("tool.tar.xz"))
        self.assertTrue(is_linux_recommended("portable_build.zip"))

        # Non-Linux assets
        self.assertFalse(is_linux_recommended("game-windows-x64.zip"))
        self.assertFalse(is_linux_recommended("installer.exe"))
        self.assertFalse(is_linux_recommended("setup.msi"))
        self.assertFalse(is_linux_recommended("app-darwin-arm64.dmg"))
        self.assertFalse(is_linux_recommended("android_release.apk"))

    async def test_invalid_repo_name(self):
        client = GitHubClient()
        with self.assertRaises(GitHubAPIError):
            await client.fetch_releases("invalid..repo///format")

if __name__ == "__main__":
    unittest.main()
