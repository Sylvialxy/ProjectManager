from dataclasses import dataclass, field


@dataclass
class Team:
    name: str
    members: set[str] = field(default_factory=set)


@dataclass
class Project:
    name: str
    team_name: str
    assignees: set[str] = field(default_factory=set)


class TeamProjectManager:
    def __init__(self) -> None:
        self._teams: dict[str, Team] = {}
        self._projects: dict[str, Project] = {}

    def create_team(self, team_name: str, members: list[str] | None = None) -> Team:
        if team_name in self._teams:
            raise ValueError(f"Team '{team_name}' already exists.")
        team = Team(name=team_name, members=set(members or []))
        self._teams[team_name] = team
        return team

    def create_project(self, project_name: str, team_name: str) -> Project:
        if project_name in self._projects:
            raise ValueError(f"Project '{project_name}' already exists.")
        if team_name not in self._teams:
            raise ValueError(f"Team '{team_name}' does not exist.")
        project = Project(name=project_name, team_name=team_name)
        self._projects[project_name] = project
        return project

    def assign_member_to_project(self, member_name: str, project_name: str) -> None:
        project = self._projects.get(project_name)
        if project is None:
            raise ValueError(f"Project '{project_name}' does not exist.")

        team = self._teams.get(project.team_name)
        if team is None:
            raise ValueError(f"Team '{project.team_name}' does not exist.")

        if member_name not in team.members:
            raise ValueError(
                f"Member '{member_name}' is not part of team '{team.name}'."
            )

        project.assignees.add(member_name)

    def projects_for_member(self, member_name: str) -> list[str]:
        projects = [
            project.name
            for project in self._projects.values()
            if member_name in project.assignees
        ]
        return sorted(projects)
