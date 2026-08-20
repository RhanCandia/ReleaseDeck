import os
import json

def get_plugin_version() -> str:
    """
    Returns the current plugin version as a single source of truth:
    1. Checks PLUGIN_VERSION or SIDEDECK_VERSION environment variables.
    2. Reads "version" from package.json at plugin root.
    3. Falls back safely if running in an isolated environment.
    """
    env_ver = os.environ.get("PLUGIN_VERSION") or os.environ.get("SIDEDECK_VERSION")
    if env_ver:
        return env_ver.lstrip("v").strip()

    try:
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        pkg_path = os.path.join(root_dir, "package.json")
        if os.path.exists(pkg_path):
            with open(pkg_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "version" in data:
                    return str(data["version"]).strip()
    except Exception:
        pass

    return "0.2.1"
