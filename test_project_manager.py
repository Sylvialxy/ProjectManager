import unittest

from project_manager import TeamProjectManager


class TeamProjectManagerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.manager = TeamProjectManager()

    def test_create_team_project_and_assign_member(self) -> None:
        self.manager.create_team("Product", members=["Lina", "Wei"])
        self.manager.create_project("Roadmap", "Product")

        self.manager.assign_member_to_project("Lina", "Roadmap")

        self.assertEqual(["Roadmap"], self.manager.projects_for_member("Lina"))

    def test_assign_member_not_in_team_raises(self) -> None:
        self.manager.create_team("Design", members=["Ming"])
        self.manager.create_project("Landing Page", "Design")

        with self.assertRaisesRegex(ValueError, "not part of team"):
            self.manager.assign_member_to_project("Chen", "Landing Page")

    def test_duplicate_names_raise_errors(self) -> None:
        self.manager.create_team("Ops")
        self.manager.create_project("Deploy", "Ops")

        with self.assertRaisesRegex(ValueError, "already exists"):
            self.manager.create_team("Ops")

        with self.assertRaisesRegex(ValueError, "already exists"):
            self.manager.create_project("Deploy", "Ops")

    def test_projects_for_member_handles_empty_and_sorted_results(self) -> None:
        self.manager.create_team("Platform", members=["A", "B"])
        self.manager.create_project("Zeta", "Platform")
        self.manager.create_project("Alpha", "Platform")

        self.assertEqual([], self.manager.projects_for_member("B"))

        self.manager.assign_member_to_project("A", "Zeta")
        self.manager.assign_member_to_project("A", "Alpha")
        self.assertEqual(["Alpha", "Zeta"], self.manager.projects_for_member("A"))


if __name__ == "__main__":
    unittest.main()
