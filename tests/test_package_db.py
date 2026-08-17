import unittest
import sys
import os
import tempfile

# Include project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import tests.mock_decky  # noqa: F401

from backend.package_db import PackageDB, compute_directory_size

class TestPackageDB(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="test_db_")
        self.db = PackageDB(self.test_dir)

    def tearDown(self):
        import shutil
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_crud_lifecycle(self):
        # 1. Add package
        install_dir = os.path.join(self.test_dir, "test_app")
        os.makedirs(install_dir, exist_ok=True)
        with open(os.path.join(install_dir, "file.bin"), "wb") as f:
            f.write(b"0" * 1024)

        pkg = self.db.add_or_update_package(
            repo="TestOrg/TestApp",
            name="Test App",
            version="v1.0.0",
            asset_name="testapp-linux.tar.gz",
            install_path=install_dir
        )

        self.assertEqual(pkg["id"], "testorg-testapp")
        self.assertEqual(pkg["installed_version"], "v1.0.0")

        # 2. Get packages
        all_pkgs = self.db.get_all_packages()
        self.assertEqual(len(all_pkgs), 1)
        self.assertEqual(all_pkgs[0]["size_bytes"], 1024)

        # 3. Update version status
        self.db.update_package_version_status("testorg-testapp", "v1.1.0", has_update=True)
        pkg_fetched = self.db.get_package("testorg-testapp")
        self.assertTrue(pkg_fetched["has_update"])
        self.assertEqual(pkg_fetched["latest_version"], "v1.1.0")

        # 4. Remove package
        removed = self.db.remove_package("testorg-testapp", delete_files=True)
        self.assertTrue(removed)
        self.assertEqual(len(self.db.get_all_packages()), 0)
        self.assertFalse(os.path.exists(install_dir))

    def test_settings_persistence(self):
        settings = self.db.get_settings()
        self.assertIn("pinned_repos", settings)

        self.db.update_settings({"github_token": "ghp_mock123"})
        updated = self.db.get_settings()
        self.assertEqual(updated["github_token"], "ghp_mock123")

if __name__ == "__main__":
    unittest.main()
