# ProjectManager

A lightweight Python implementation for 团队项目管理 (team project management).

## Features

- Create teams with members
- Create projects owned by a team
- Assign team members to projects
- Query projects by member

## Quick Start

```python
from project_manager import TeamProjectManager

manager = TeamProjectManager()
manager.create_team("Backend", members=["Alice", "Bob"])
manager.create_project("API Refactor", "Backend")
manager.assign_member_to_project("Alice", "API Refactor")
print(manager.projects_for_member("Alice"))  # ["API Refactor"]
```