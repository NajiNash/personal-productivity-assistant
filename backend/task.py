class Task:
    def __init__(self, task_id, title, priority, due_date, category, estimated_duration, recurrence="None", completed=False):
        self.id = task_id
        self.title = title
        self.priority = priority
        self.due_date = due_date
        self.category = category
        self.estimated_duration = estimated_duration
        self.recurrence = recurrence
        self.completed = completed

    def to_dict(self):
        return{
            "id": self.id,
            "title": self.title,
            "priority": self.priority,
            "due_date": self.due_date,
            "completed": self.completed
        }

    def mark_complete(self):
        self.completed = True

    def edit_title(self, new_title):
        self.title = new_title

    def change_priority(self, new_priority):
        self.priority = new_priority

    def change_category(self, new_category):
        self.category - new_category

    def change_estimated_duration(self, new_duration):
        self.estimated_duration = new_duration