from datetime import datetime, timedelta
import calendar

from task import Task

def calculate_statistics(tasks):
    total_tasks = len(tasks)

    completed_tasks = 0
    incomplete_tasks = 0
    overdue_tasks = 0
    remaining_minutes = 0

    today = datetime.today().date()

    for task in tasks:
        if task.completed:
            completed_tasks += 1

        else:
            incomplete_tasks += 1
            remaining_minutes += task.estimated_duration

            task_date = datetime.strptime(
                task.due_date,
                "%Y-%m-%d"
            ).date()

            if task_date < today:
                overdue_tasks += 1

    if total_tasks > 0:
        completion_percentage = (
            completed_tasks / total_tasks
        ) * 100
    else:
        completion_percentage = 0

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "incomplete_tasks": incomplete_tasks,
        "overdue_tasks": overdue_tasks,
        "completion_percentage": completion_percentage,
        "remaining_minutes": remaining_minutes
    }

def plan_tasks(tasks, plan_date, available_minutes):
    selected_date = datetime.strptime(
        plan_date,
        "%Y-%m-%d"
    ).date()

    priority_order = {
        "High": 1,
        "Medium": 2,
        "Low": 3
    }

    eligible_tasks = []

    for task in tasks:
        if task.completed:
            continue

        task_date = datetime.strptime(
            task.due_date,
            "%Y-%m-%d"
        ).date()

        if task_date <= selected_date:
            eligible_tasks.append(task)

    eligible_tasks.sort(
        key=lambda task: (
            task.due_date,
            priority_order[task.priority]
        )
    )

    remaining_minutes = available_minutes
    planned_tasks = []
    unscheduled_tasks = []

    for task in eligible_tasks:
        if task.estimated_duration <= 0:
            continue

        if task.estimated_duration <= remaining_minutes:
            planned_tasks.append(task)
            remaining_minutes -= task.estimated_duration

        else:
            unscheduled_tasks.append(task)

    scheduled_minutes = (
        available_minutes - remaining_minutes
    )

    return {
    "planned_tasks": planned_tasks,
    "unscheduled_tasks": unscheduled_tasks,
    "scheduled_minutes": scheduled_minutes,
    "remaining_minutes": remaining_minutes
    }

def get_overdue_tasks(tasks):
    today = datetime.today().date()
    overdue_tasks = []

    for task in tasks:
        if task.completed:
            continue

        task_date = datetime.strptime(
            task.due_date,
            "%Y-%m-%d"
        ).date()

        if task_date < today:
            overdue_tasks.append(task)

    return overdue_tasks

def get_tasks_for_date(tasks, selected_date):
    tasks_for_date = []

    for task in tasks:
        if task.due_date == selected_date:
            tasks_for_date.append(task)

    return tasks_for_date

def get_completed_tasks(tasks):
    completed_tasks = []

    for task in tasks:
        if task.completed:
            completed_tasks.append(task)

    return completed_tasks

def get_incomplete_tasks(tasks):
    incomplete_tasks = []

    for task in tasks:
        if not task.completed:
            incomplete_tasks.append(task)

    return incomplete_tasks

def get_tasks_by_priority(tasks, priority):
    matching_tasks = []

    for task in tasks:
        if task.priority == priority:
            matching_tasks.append(task)

    return matching_tasks

def get_tasks_by_category(tasks, category):
    matching_tasks = []

    for task in tasks:
        if task.category == category:
            matching_tasks.append(task)

    return matching_tasks

def sort_tasks_by_due_date(tasks):
    return sorted(
        tasks,
        key=lambda task: task.due_date
    )

def sort_tasks_by_priority(tasks):
    priority_order = {
        "High": 1,
        "Medium": 2,
        "Low": 3
    }

    return sorted(
        tasks,
        key=lambda task: priority_order[task.priority]
    )

def get_next_due_date(task):
    current_date = datetime.strptime(
        task.due_date,
        "%Y-%m-%d"
    ).date()

    if task.recurrence == "Daily":
        next_date = current_date + timedelta(days=1)

    elif task.recurrence == "Weekly":
        next_date = current_date + timedelta(days=7)

    elif task.recurrence == "Monthly":
        year = current_date.year
        month = current_date.month + 1

        if month == 13:
            month = 1
            year += 1

        last_day = calendar.monthrange(year, month)[1]
        day = min(current_date.day, last_day)

        next_date = current_date.replace(
            year = year,
            month = month,
            day = day
        )

    else:
        return None

    return next_date.strftime("%Y-%m-%d")

def build_next_occurrence(task):
    if task.recurrence == "None":
        return None

    next_due_date = get_next_due_date(task)

    return Task(
        None,
        task.title,
        task.priority,
        next_due_date,
        task.category,
        task.estimated_duration,
        task.recurrence
    )