"""End-to-End Simulation Test for ReleaseDeck."""
import asyncio
import os
import sys
import tempfile
import zipfile

# Include project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import tests.mock_decky  # noqa: F401

from main import Plugin

async def run_e2e():
    print("=== Starting ReleaseDeck E2E Simulation ===")
    plugin = Plugin()
    await plugin._main()

    test_home = tempfile.mkdtemp(prefix="releasedeck_e2e_home_")
    test_install_dir = os.path.join(test_home, "Applications")

    # Mock download file locally by monkey-patching downloader
    test_zip = os.path.join(test_home, "fixture.zip")
    with zipfile.ZipFile(test_zip, "w") as zf:
        zf.writestr("launcher.sh", "#!/bin/bash\necho 'Running Game Port'\n")
        zf.writestr("game.bin", b"\x7fELF" + b"0" * 500)
        zf.writestr("config.json", '{"ready": true}')

    async def mock_download_file(url, dest_path, progress_cb=None):
        if progress_cb:
            progress_cb(50.0, 10.5, 500, 1000)
            progress_cb(100.0, 12.0, 1000, 1000)
        import shutil
        shutil.copy2(test_zip, dest_path)

    plugin.downloader.download_file = mock_download_file

    print("\n1. Testing start_download()...")
    res = await plugin.start_download(
        repo="SampleOrg/SampleGame",
        name="Sample Game",
        version="v1.0.0",
        asset_name="samplegame-linux.zip",
        download_url="https://github.com/SampleOrg/SampleGame/releases/download/v1.0.0/samplegame-linux.zip",
        custom_install_dir=test_install_dir
    )
    assert res["success"], f"Download failed: {res}"
    print("✓ Package installed successfully:", res["install_path"])

    print("\n2. Testing get_installed_packages()...")
    packages = await plugin.get_installed_packages()
    assert len(packages) == 1, f"Expected 1 package, got {len(packages)}"
    pkg = packages[0]
    assert pkg["id"] == "sampleorg-samplegame"
    assert pkg["installed_version"] == "v1.0.0"
    print("✓ Package registered in database with size:", pkg["size_bytes"], "bytes")

    print("\n3. Testing uninstall_package()...")
    uninst_res = await plugin.uninstall_package(pkg["id"], delete_files=True)
    assert uninst_res["success"], f"Uninstall failed: {uninst_res}"
    remaining = await plugin.get_installed_packages()
    assert len(remaining) == 0, "Package was not removed from DB"
    assert not os.path.exists(res["install_path"]), "Directory was not deleted from disk"
    print("✓ Package uninstalled and directory cleaned up.")

    print("\n=== All E2E Tests Passed! ===")

if __name__ == "__main__":
    asyncio.run(run_e2e())
