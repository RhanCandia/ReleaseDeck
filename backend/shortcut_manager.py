"""Steam Non-Steam Game Shortcut Manager (binary shortcuts.vdf parser & writer)."""
import os
import zlib
import struct
from typing import List, Dict, Any, Optional

def calculate_shortcut_appid(exe: str, app_name: str) -> int:
    """Calculate the 32-bit signed AppID used by Steam for non-steam shortcuts."""
    key = f"{exe}{app_name}".encode('utf-8')
    crc = zlib.crc32(key)
    return (crc | 0x80000000) & 0xFFFFFFFF

def get_steam_userdata_dirs() -> List[str]:
    """Find all Steam userdata config directories on the system."""
    home = os.path.expanduser("~")
    candidates = [
        os.path.join(home, ".local/share/Steam/userdata"),
        os.path.join(home, ".steam/steam/userdata"),
        os.path.join(home, ".steam/root/userdata"),
    ]
    config_dirs = []
    for base in candidates:
        if os.path.isdir(base):
            for user_id in os.listdir(base):
                if user_id.isdigit() and user_id != "0":
                    cfg_dir = os.path.join(base, user_id, "config")
                    if os.path.isdir(cfg_dir) and cfg_dir not in config_dirs:
                        config_dirs.append(cfg_dir)
            if not config_dirs:
                for user_id in os.listdir(base):
                    cfg_dir = os.path.join(base, user_id, "config")
                    if os.path.isdir(cfg_dir) and cfg_dir not in config_dirs:
                        config_dirs.append(cfg_dir)
    return config_dirs

def parse_binary_vdf(data: bytes) -> Dict[str, Any]:
    """Parse binary VDF buffer into a Python dict."""
    pos = 0
    
    def read_string() -> str:
        nonlocal pos
        end = data.find(b'\x00', pos)
        if end == -1:
            raise ValueError("Unterminated string in binary VDF")
        res = data[pos:end].decode('utf-8', errors='ignore')
        pos = end + 1
        return res

    def parse_dict() -> Dict[str, Any]:
        nonlocal pos
        result = {}
        while pos < len(data):
            type_byte = data[pos]
            pos += 1
            if type_byte == 0x08:  # End of dictionary
                break
            elif type_byte == 0x00:  # Sub-dictionary
                key = read_string()
                result[key] = parse_dict()
            elif type_byte == 0x01:  # String
                key = read_string()
                val = read_string()
                result[key] = val
            elif type_byte == 0x02:  # 32-bit int
                key = read_string()
                val = struct.unpack('<I', data[pos:pos+4])[0]
                pos += 4
                result[key] = val
            else:
                break
        return result

    try:
        if data.startswith(b'\x00shortcuts\x00'):
            pos = len(b'\x00shortcuts\x00')
            return parse_dict()
    except Exception:
        pass
    return {}

def serialize_binary_vdf(shortcuts_dict: Dict[str, Any]) -> bytes:
    """Serialize shortcuts dict back into binary VDF format."""
    out = bytearray(b'\x00shortcuts\x00')

    def write_dict(d: Dict[str, Any]):
        for key, val in d.items():
            if isinstance(val, dict):
                out.append(0x00)
                out.extend(key.encode('utf-8') + b'\x00')
                write_dict(val)
                out.append(0x08)
            elif isinstance(val, str):
                out.append(0x01)
                out.extend(key.encode('utf-8') + b'\x00')
                out.extend(val.encode('utf-8') + b'\x00')
            elif isinstance(val, int):
                out.append(0x02)
                out.extend(key.encode('utf-8') + b'\x00')
                out.extend(struct.pack('<I', val & 0xFFFFFFFF))
            elif isinstance(val, list):
                out.append(0x00)
                out.extend(key.encode('utf-8') + b'\x00')
                for idx, item in enumerate(val):
                    out.append(0x01)
                    out.extend(str(idx).encode('utf-8') + b'\x00')
                    out.extend(str(item).encode('utf-8') + b'\x00')
                out.append(0x08)

    write_dict(shortcuts_dict)
    out.append(0x08)
    return bytes(out)

def add_or_update_shortcut(app_name: str, exe_path: str, start_dir: Optional[str] = None, launch_options: str = "") -> bool:
    """
    Directly writes or updates a Non-Steam shortcut in all Steam userdata shortcuts.vdf files.
    """
    if not start_dir:
        start_dir = os.path.dirname(exe_path)
    
    quoted_exe = f'"{exe_path}"' if not exe_path.startswith('"') else exe_path
    clean_start_dir = start_dir if start_dir.endswith("/") else f"{start_dir}/"
    appid = calculate_shortcut_appid(quoted_exe, app_name)
    
    config_dirs = get_steam_userdata_dirs()
    if not config_dirs:
        return False
    
    success = False
    for cfg_dir in config_dirs:
        vdf_path = os.path.join(cfg_dir, "shortcuts.vdf")
        existing_shortcuts = {}
        if os.path.exists(vdf_path):
            try:
                with open(vdf_path, "rb") as f:
                    content = f.read()
                    existing_shortcuts = parse_binary_vdf(content)
            except Exception:
                existing_shortcuts = {}
        
        # Check if already exists (by exe or by appname), update or add
        found_key = None
        for k, v in existing_shortcuts.items():
            if isinstance(v, dict):
                cur_exe = v.get("exe") or v.get("Exe") or ""
                cur_name = v.get("appname") or v.get("AppName") or ""
                if cur_exe == quoted_exe or cur_exe == exe_path or cur_name == app_name or cur_name == "run.sh":
                    found_key = k
                    break
        
        if found_key is None:
            found_key = str(len(existing_shortcuts))
        
        existing_shortcuts[found_key] = {
            "appid": appid,
            "AppName": app_name,
            "Exe": quoted_exe,
            "StartDir": clean_start_dir,
            "icon": "",
            "ShortcutPath": "",
            "LaunchOptions": launch_options,
            "IsHidden": 0,
            "AllowDesktopConfig": 1,
            "AllowOverlay": 1,
            "OpenVR": 0,
            "Devkit": 0,
            "DevkitGameID": "",
            "DevkitOverrideAppID": 0,
            "LastPlayTime": 0,
            "FlatpakAppID": "",
            "sortas": "",
            "tags": {"0": "SideDeck"}
        }
        
        try:
            os.makedirs(cfg_dir, exist_ok=True)
            vdf_bytes = serialize_binary_vdf(existing_shortcuts)
            with open(vdf_path, "wb") as f:
                f.write(vdf_bytes)
            success = True
        except Exception:
            pass
            
    return success
