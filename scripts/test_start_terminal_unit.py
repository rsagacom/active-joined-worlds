#!/usr/bin/env python3
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPT_PATH = Path(__file__).with_name("test_start_terminal.py")


def load_target_module():
    spec = importlib.util.spec_from_file_location("test_start_terminal", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class ResolveRootTests(unittest.TestCase):
    def test_resolve_root_defaults_to_repo_root_from_script_path(self):
        target = load_target_module()
        expected = str(SCRIPT_PATH.resolve().parent.parent)
        self.assertEqual(target.resolve_root(), expected)

    def test_resolve_root_prefers_environment_override(self):
        target = load_target_module()
        with tempfile.TemporaryDirectory() as temp_dir:
            with mock.patch.dict(target.os.environ, {"LOBSTER_CHAT_ROOT": temp_dir}, clear=False):
                self.assertEqual(target.resolve_root(), temp_dir)


class SmokeDumpTests(unittest.TestCase):
    def test_run_smoke_json_requests_json_dump_and_parses_payload(self):
        target = load_target_module()
        completed = mock.Mock(stdout='{"surface_kind":"CityPublic","visible_panels":["status"]}')

        with mock.patch.object(target.subprocess, "run", return_value=completed) as run_mock:
            payload = target.run_smoke_json("user", "/tmp/lobster-state")

        self.assertEqual(payload["surface_kind"], "CityPublic")
        _, kwargs = run_mock.call_args
        self.assertEqual(kwargs["env"]["LOBSTER_TUI_SMOKE_DUMP"], "json")
        self.assertEqual(kwargs["env"]["LOBSTER_TUI_STATE_DIR"], "/tmp/lobster-state")


if __name__ == "__main__":
    unittest.main()
