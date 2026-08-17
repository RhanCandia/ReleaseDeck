"""Mock decky module for off-device testing and CI environments."""
import sys
import tempfile
from types import ModuleType

class MockLogger:
    def info(self, msg):
        print(f"[INFO] {msg}")
    def warn(self, msg):
        print(f"[WARN] {msg}")
    def error(self, msg):
        print(f"[ERROR] {msg}")
    def debug(self, msg):
        print(f"[DEBUG] {msg}")

mock_decky = ModuleType("decky")
mock_decky.logger = MockLogger()
mock_decky.DECKY_SETTINGS_DIR = tempfile.mkdtemp(prefix="mock_decky_settings_")
mock_decky.DECKY_USER_HOME = tempfile.mkdtemp(prefix="mock_decky_home_")
mock_decky.DECKY_HOME = mock_decky.DECKY_SETTINGS_DIR
mock_decky.DECKY_PLUGIN_LOG_DIR = tempfile.mkdtemp(prefix="mock_decky_logs_")
mock_decky.DECKY_PLUGIN_SETTINGS_DIR = mock_decky.DECKY_SETTINGS_DIR
mock_decky.DECKY_PLUGIN_RUNTIME_DIR = tempfile.mkdtemp(prefix="mock_decky_runtime_")

emitted_events = []

async def mock_emit(event_name: str, data: any):
    emitted_events.append({"event": event_name, "data": data})

mock_decky.emit = mock_emit

# Register in sys.modules so `import decky` works in any test
sys.modules["decky"] = mock_decky
