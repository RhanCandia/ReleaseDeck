import unittest
import sys
import os

# Include project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import tests.mock_decky  # noqa: F401

from backend.updater import is_newer_version, find_matching_upgrade_asset

class TestUpdater(unittest.TestCase):
    def test_version_comparison(self):
        self.assertTrue(is_newer_version("v1.0.0", "v1.1.0"))
        self.assertTrue(is_newer_version("1.0.0", "2.0.0"))
        self.assertTrue(is_newer_version("v1.0.0", "v1.0.1"))
        self.assertTrue(is_newer_version("v1.0.0-beta", "v1.0.0"))
        
        self.assertFalse(is_newer_version("v1.2.0", "v1.2.0"))
        self.assertFalse(is_newer_version("v2.0.0", "v1.9.9"))
        self.assertFalse(is_newer_version("v1.1.0", "v1.0.0"))

    def test_matching_asset_upgrade_finder(self):
        new_assets = [
            {"name": "app-windows-x64.zip", "download_url": "https://.../win.zip", "is_recommended": False},
            {"name": "app-linux-x64.tar.gz", "download_url": "https://.../linux.tar.gz", "is_recommended": True},
            {"name": "app-x86_64.AppImage", "download_url": "https://.../app.AppImage", "is_recommended": True},
        ]

        # Should match the linux tar.gz
        matched_tar = find_matching_upgrade_asset("app-v1.0-linux-x64.tar.gz", new_assets)
        self.assertIsNotNone(matched_tar)
        self.assertEqual(matched_tar["name"], "app-linux-x64.tar.gz")

        # Should match the AppImage
        matched_appimage = find_matching_upgrade_asset("app-v1.0.AppImage", new_assets)
        self.assertIsNotNone(matched_appimage)
        self.assertEqual(matched_appimage["name"], "app-x86_64.AppImage")

if __name__ == "__main__":
    unittest.main()
