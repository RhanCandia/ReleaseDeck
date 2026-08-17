import unittest
import sys
import os
import tempfile
import zipfile
import tarfile
import stat

# Include project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import tests.mock_decky  # noqa: F401

from backend.downloader import (
    Downloader,
    sanitize_extract_path,
    ExtractionError,
    make_executable,
    inspect_and_mark_executables
)

class TestDownloader(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="test_downloader_")

    def tearDown(self):
        import shutil
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_zip_slip_prevention(self):
        target = os.path.join(self.test_dir, "app")
        os.makedirs(target, exist_ok=True)
        
        # Valid path
        valid_dest = sanitize_extract_path(target, "subfolder/binary")
        self.assertTrue(valid_dest.startswith(target))

        # Malicious traversal path
        with self.assertRaises(ExtractionError):
            sanitize_extract_path(target, "../../etc/passwd")

    def test_zip_archive_extraction_and_permissions(self):
        zip_path = os.path.join(self.test_dir, "test.zip")
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr("run.sh", "#!/bin/bash\necho hello\n")
            zf.writestr("data.txt", "some data")

        extract_target = os.path.join(self.test_dir, "extracted_zip")
        Downloader.extract_archive(zip_path, extract_target)

        run_script = os.path.join(extract_target, "run.sh")
        self.assertTrue(os.path.exists(run_script))
        
        # Verify executable permission is set
        st = os.stat(run_script)
        self.assertTrue(bool(st.st_mode & stat.S_IXUSR))

    def test_tar_gz_extraction(self):
        tar_path = os.path.join(self.test_dir, "test.tar.gz")
        with tarfile.open(tar_path, "w:gz") as tf:
            info = tarfile.TarInfo(name="app.bin")
            content = b"\x7fELFfakebinarycontent"
            info.size = len(content)
            import io
            tf.addfile(info, io.BytesIO(content))

        extract_target = os.path.join(self.test_dir, "extracted_tar")
        Downloader.extract_archive(tar_path, extract_target)

        app_bin = os.path.join(extract_target, "app.bin")
        self.assertTrue(os.path.exists(app_bin))
        st = os.stat(app_bin)
        self.assertTrue(bool(st.st_mode & stat.S_IXUSR))

    def test_nested_archive_extraction(self):
        # Create a nested tar.gz inside a zip
        tar_path = os.path.join(self.test_dir, "inner.tar.gz")
        with tarfile.open(tar_path, "w:gz") as tf:
            info = tarfile.TarInfo(name="nested_game")
            content = b"\x7fELFgamebinary"
            info.size = len(content)
            import io
            tf.addfile(info, io.BytesIO(content))

        zip_path = os.path.join(self.test_dir, "outer.zip")
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.write(tar_path, arcname="inner.tar.gz")

        extract_target = os.path.join(self.test_dir, "extracted_nested")
        Downloader.extract_archive(zip_path, extract_target)

        # Verify the nested executable was unpacked and marked executable
        nested_bin = os.path.join(extract_target, "nested_game")
        self.assertTrue(os.path.exists(nested_bin))
        st = os.stat(nested_bin)
        self.assertTrue(bool(st.st_mode & stat.S_IXUSR))

if __name__ == "__main__":
    unittest.main()
