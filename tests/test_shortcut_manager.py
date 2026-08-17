import unittest
import tempfile
import os
from backend.shortcut_manager import (
    calculate_shortcut_appid,
    serialize_binary_vdf,
    parse_binary_vdf,
    add_or_update_shortcut
)

class TestShortcutManager(unittest.TestCase):
    def test_calculate_appid(self):
        appid = calculate_shortcut_appid('"/home/deck/Applications/Test/app"', "TestApp")
        self.assertIsInstance(appid, int)
        self.assertGreater(appid, 0)
        # Top bit must be set for Steam non-steam shortcut appids
        self.assertTrue(bool(appid & 0x80000000))

    def test_binary_vdf_roundtrip(self):
        sample = {
            "0": {
                "appid": 3200112233,
                "AppName": "SymphonyRecomp",
                "Exe": '"/home/deck/Applications/SymphonyRecomp/run.sh"',
                "StartDir": "/home/deck/Applications/SymphonyRecomp/",
                "tags": {"0": "ReleaseDeck"}
            }
        }
        serialized = serialize_binary_vdf(sample)
        self.assertTrue(serialized.startswith(b'\x00shortcuts\x00'))
        
        parsed = parse_binary_vdf(serialized)
        self.assertIn("0", parsed)
        self.assertEqual(parsed["0"]["AppName"], "SymphonyRecomp")
        self.assertEqual(parsed["0"]["Exe"], '"/home/deck/Applications/SymphonyRecomp/run.sh"')
        self.assertEqual(parsed["0"]["appid"], 3200112233)

if __name__ == "__main__":
    unittest.main()
