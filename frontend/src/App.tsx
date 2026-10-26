import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type Task = {
  id: number;
  title: string;
  priority: string;
  due_date: string;
  category: string;
  estimated_duration: number;
  recurrence: string;
  completed: boolean;
};

type Statistics = {
  total_tasks: number;
  completed_tasks: number;
  incomplete_tasks: number;
  overdue_tasks: number;
  completion_percentage: number;
  remaining_minutes: number;
};

type PlanResult = {
  planned_tasks: Task[];
  unscheduled_tasks: Task[];
  scheduled_minutes: number;
  remaining_minutes: number;
};

type AITaskCandidate = {
  title: string;
  priority: string;
  due_date: string;
  category: string;
  estimated_duration: number;
  recurrence: string;
};

function App() {

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Other");
  const [dueDate, setDueDate] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [recurrence, setRecurrence] = useState("None");
  const [editingTaskId, setEditingTaskId] =
  useState<number | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editEstimatedDuration, setEditEstimatedDuration] =
    useState("");
  const [editRecurrence, setEditRecurrence] = useState("");
  const [statistics, setStatistics] =
    useState<Statistics | null>(null);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [planDate, setPlanDate] = useState("");
  const [availableMinutes, setAvailableMinutes] =
    useState("");

  const [planResult, setPlanResult] =
    useState<PlanResult | null>(null);

  const [isPlanning, setIsPlanning] = useState(false);
  const [planError, setPlanError] = useState("");

  const [aiTaskText, setAiTaskText] = useState("");
  const [isParsingTask, setIsParsingTask] = useState(false);
  const [aiTaskError, setAiTaskError] = useState("");

  async function fetchTasks() {
    const response = await fetch(
      "http://127.0.0.1:8000/tasks",
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    setTasks(data);
  }

  async function fetchStatistics() {
    const response = await fetch(
      "http://127.0.0.1:8000/statistics",
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    setStatistics(data);
  }

  async function handleAddTask(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const response = await fetch(
      "http://127.0.0.1:8000/tasks",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          priority: priority,
          due_date: dueDate,
          category: category,
          estimated_duration: Number(estimatedDuration),
          recurrence: recurrence,
        }),
      }
    );

    if (response.ok) {
      setTitle("");
      setPriority("Medium");
      setCategory("Other");
      setDueDate("");
      setEstimatedDuration("");
      setRecurrence("None");

      await Promise.all([
        fetchTasks(),
        fetchStatistics(),
        fetchOverdueTasks(),
      ]);

      if (planResult !== null) {
        await fetchPlan();
      }
    }
  }

  async function handleCompleteTask(taskId: number) {
    const response = await fetch(
      `http://127.0.0.1:8000/tasks/${taskId}/complete`,
      {
        method: "PATCH",
      }
    );

    if (response.ok) {
      await Promise.all([
        fetchTasks(),
        fetchStatistics(),
        fetchOverdueTasks(),
      ]);

      if (planResult !== null) {
        await fetchPlan();
      }
    }
  }

  async function handleDeleteTask(taskId: number) {
    const response = await fetch(
      `http://127.0.0.1:8000/tasks/${taskId}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      await Promise.all([
        fetchTasks(),
        fetchStatistics(),
        fetchOverdueTasks(),
      ]);

      if (planResult !== null) {
        await fetchPlan();
      }
    }
  }

  async function handlePlanDay(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    await fetchPlan();
  }

  function startEditing(task: Task) {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditCategory(task.category);
    setEditDueDate(task.due_date);
    setEditEstimatedDuration(
      task.estimated_duration.toString()
    );
    setEditRecurrence(task.recurrence);
  }

  async function handleUpdateTask(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (editingTaskId === null) {
      return;
    }

    const response = await fetch(
      `http://127.0.0.1:8000/tasks/${editingTaskId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          priority: editPriority,
          category: editCategory,
          due_date: editDueDate,
          estimated_duration: Number(editEstimatedDuration),
          recurrence: editRecurrence,
        }),
      }
    );

    if (response.ok) {
      setEditingTaskId(null);

      await Promise.all([
        fetchTasks(),
        fetchStatistics(),
        fetchOverdueTasks(),
      ]);
    }
    if (planResult !== null) {
      await fetchPlan();
    }
  }

  async function handleParseAITask() {
    setIsParsingTask(true);
    setAiTaskError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/ai/parse-task",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: aiTaskText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not understand the task.");
      }

      const data: AITaskCandidate =
        await response.json();

      setTitle(data.title);
      setPriority(data.priority);
      setDueDate(data.due_date);
      setCategory(data.category);
      setEstimatedDuration(
        data.estimated_duration.toString()
      );
      setRecurrence(data.recurrence);
    } catch (error) {
      setAiTaskError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setIsParsingTask(false);
    }
  }

  async function fetchOverdueTasks() {
    const response = await fetch(
      "http://127.0.0.1:8000/tasks/overdue"
    );

    const data = await response.json();

    setOverdueTasks(data);
  }

  async function fetchPlan() {
  setIsPlanning(true);
  setPlanError("");

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/plan",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_date: planDate,
          available_minutes: Number(availableMinutes),
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Could not generate the plan.");
    }

    const data: PlanResult = await response.json();

    setPlanResult(data);
    } catch (error) {
      setPlanError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setIsPlanning(false);
    }
  }

  useEffect(() => {
    fetchTasks();
    fetchStatistics();
    fetchOverdueTasks();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Personal Productivity Assistant</h1>
          <p>Stay organized and make the most of your day.</p>
        </div>
      </header>

      {statistics && (
        <section className="statistics-section">
          <h2>Overview</h2>

          <div className="statistics-grid">
            <div className="stat-card">
              <span className="stat-label">Total Tasks</span>
              <span className="stat-value">
                {statistics.total_tasks}
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Completed</span>
              <span className="stat-value">
                {statistics.completed_tasks}
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Incomplete</span>
              <span className="stat-value">
                {statistics.incomplete_tasks}
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Overdue</span>
              <span className="stat-value">
                {statistics.overdue_tasks}
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Completion</span>
              <span className="stat-value">
                {statistics.completion_percentage.toFixed(1)}%
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Remaining Work</span>
              <span className="stat-value">
                {statistics.remaining_minutes} min
              </span>
            </div>
          </div>
        </section>
      )}

      <section className="overdue-section">
        <div className="section-header">
          <h2>Overdue Tasks</h2>
          <p>Tasks that need your attention.</p>
        </div>

        {overdueTasks.length === 0 ? (
          <div className="empty-state">
            <p>No overdue tasks.</p>
          </div>
        ) : (
          <div className="overdue-grid">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="overdue-card"
              >
                <div className="overdue-card-header">
                  <h3>{task.title}</h3>

                  <span
                    className={`priority-badge priority-${task.priority.toLowerCase()}`}
                  >
                    {task.priority}
                  </span>
                </div>

                <p className="overdue-category">
                  {task.category}
                </p>

                <div className="overdue-details">
                  <span>Due: {task.due_date}</span>

                  <span>
                    {task.estimated_duration} min
                  </span>
                </div>

                <span className="status-overdue">
                  Overdue
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      
      <section className="ai-task-section">
        <div className="section-header">
          <h2>AI Task Assistant</h2>
          <p>
            Describe a task naturally and let AI fill in the form.
          </p>
        </div>

        <div className="ai-task-input">
          <textarea
            value={aiTaskText}
            onChange={(event) =>
              setAiTaskText(event.target.value)
            }
            placeholder="Example: Finish my cybersecurity report tomorrow, high priority, study, 90 minutes"
            rows={3}
          />

          <button
            className="primary-button"
            type="button"
            onClick={handleParseAITask}
            disabled={
              isParsingTask || aiTaskText.trim() === ""
            }
          >
            {isParsingTask
              ? "Understanding..."
              : "Fill Task with AI"}
          </button>
        </div>

        {aiTaskError && (
          <p className="planner-error">
            {aiTaskError}
          </p>
        )}
      </section>

      <section className="task-form-section">
        <div className="section-header">
          <h2>Add a New Task</h2>
          <p>Create a task and add it to your schedule.</p>
        </div>

        <form
          className="task-form"
          onSubmit={handleAddTask}
        >
          <div className="form-group">
            <label htmlFor="title">Title</label>

            <input
              id="title"
              type="text"
              placeholder="Enter task title"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>

            <select
              id="priority"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value)
              }
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>

            <select
              id="category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option value="Work">Work</option>
              <option value="Study">Study</option>
              <option value="Personal">Personal</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>

            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration</label>

            <input
              id="duration"
              type="number"
              placeholder="Minutes"
              value={estimatedDuration}
              onChange={(event) =>
                setEstimatedDuration(event.target.value)
              }
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="recurrence">
              Recurrence
            </label>

            <select
              id="recurrence"
              value={recurrence}
              onChange={(event) =>
                setRecurrence(event.target.value)
              }
            >
              <option value="None">None</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              className="primary-button"
              type="submit"
            >
              Create Task
            </button>
          </div>
        </form>
      </section>

      <section className="planner-section">
        <div className="section-header">
          <h2>Daily Planner</h2>
          <p>
            Choose a date and tell me how much time you have available.
          </p>
        </div>

        <form
          className="planner-form"
          onSubmit={handlePlanDay}
        >
          <div className="form-group">
            <label htmlFor="plan-date">
              Planning Date
            </label>

            <input
              id="plan-date"
              type="date"
              value={planDate}
              onChange={(event) =>
                setPlanDate(event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="available-minutes">
              Available Time
            </label>

            <input
              id="available-minutes"
              type="number"
              placeholder="Minutes available"
              value={availableMinutes}
              onChange={(event) =>
                setAvailableMinutes(event.target.value)
              }
              min="1"
              required
            />
          </div>

          <div className="planner-actions">
            <button
              className="primary-button"
              type="submit"
              disabled={isPlanning}
            >
              {isPlanning ? "Planning..." : "Plan My Day"}
            </button>
          </div>
        </form>

        {planError && (
          <p className="planner-error">
            {planError}
          </p>
        )}

        {planResult && (
          <div className="plan-results">
            <div className="plan-summary">
              <div className="plan-summary-card">
                <span className="stat-label">
                  Scheduled
                </span>

                <span className="stat-value">
                  {planResult.scheduled_minutes} min
                </span>
              </div>

              <div className="plan-summary-card">
                <span className="stat-label">
                  Remaining
                </span>

                <span className="stat-value">
                  {planResult.remaining_minutes} min
                </span>
              </div>
            </div>

            <div className="plan-list">
              <h3>Planned Tasks</h3>

              {planResult.planned_tasks.length === 0 ? (
                <p className="plan-empty">
                  No tasks could be scheduled.
                </p>
              ) : (
                planResult.planned_tasks.map((task) => (
                  <div
                    key={task.id}
                    className="plan-task-card"
                  >
                    <div>
                      <h4>{task.title}</h4>

                      <p>
                        {task.category} ·{" "}
                        {task.estimated_duration} min
                      </p>
                    </div>

                    <span
                      className={`priority-badge priority-${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="plan-list">
              <h3>Could Not Fit</h3>

              {planResult.unscheduled_tasks.length === 0 ? (
                <p className="plan-empty">
                  All eligible tasks fit into your available time.
                </p>
              ) : (
                planResult.unscheduled_tasks.map((task) => (
                  <div
                    key={task.id}
                    className="plan-task-card unscheduled-task"
                  >
                    <div>
                      <h4>{task.title}</h4>

                      <p>
                        {task.category} ·{" "}
                        {task.estimated_duration} min
                      </p>
                    </div>

                    <span
                      className={`priority-badge priority-${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      <section className="tasks-section">
        <div className="section-header">
          <h2>All Tasks</h2>
          <p>Manage your current tasks and progress.</p>
        </div>

        <div className="tasks-grid">
          {tasks.map((task) => {
            const isOverdue = overdueTasks.some(
              (overdueTask) =>
                overdueTask.id === task.id
            );

            return (
              <div
                key={task.id}
                className={`task-card ${
                  task.completed
                    ? "task-completed"
                    : ""
                } ${
                  isOverdue
                    ? "task-overdue"
                    : ""
                }`}
              >
                <div className="task-card-header">
                  <div>
                    <h3>{task.title}</h3>

                    <span className="task-category">
                      {task.category}
                    </span>
                  </div>

                  <span
                    className={`priority-badge priority-${task.priority.toLowerCase()}`}
                  >
                    {task.priority}
                  </span>
                </div>

                <div className="task-details">
                  <span>
                    Due: {task.due_date}
                  </span>

                  <span>
                    {task.estimated_duration} min
                  </span>

                  <span>
                    {task.recurrence === "None"
                      ? "No recurrence"
                      : task.recurrence}
                  </span>
                </div>

                <div className="task-status">
                  {task.completed ? (
                    <span className="status-completed">
                      Completed
                    </span>
                  ) : isOverdue ? (
                    <span className="status-overdue">
                      Overdue
                    </span>
                  ) : (
                    <span className="status-incomplete">
                      Incomplete
                    </span>
                  )}
                </div>

                <div className="task-actions">
                  {!task.completed && (
                    <button
                      className="complete-button"
                      onClick={() =>
                        handleCompleteTask(task.id)
                      }
                    >
                      Complete
                    </button>
                  )}

                  <button
                    className="edit-button"
                    onClick={() =>
                      startEditing(task)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() =>
                      handleDeleteTask(task.id)
                    }
                  >
                    Delete
                  </button>
                </div>

                {editingTaskId === task.id && (
                  <form
                    className="edit-form"
                    onSubmit={handleUpdateTask}
                  >
                    <div className="form-group">
                      <label
                        htmlFor={`edit-title-${task.id}`}
                      >
                        Title
                      </label>

                      <input
                        id={`edit-title-${task.id}`}
                        type="text"
                        value={editTitle}
                        onChange={(event) =>
                          setEditTitle(
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label
                        htmlFor={`edit-priority-${task.id}`}
                      >
                        Priority
                      </label>

                      <select
                        id={`edit-priority-${task.id}`}
                        value={editPriority}
                        onChange={(event) =>
                          setEditPriority(
                            event.target.value
                          )
                        }
                      >
                        <option value="High">
                          High
                        </option>

                        <option value="Medium">
                          Medium
                        </option>

                        <option value="Low">
                          Low
                        </option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label
                        htmlFor={`edit-category-${task.id}`}
                      >
                        Category
                      </label>

                      <select
                        id={`edit-category-${task.id}`}
                        value={editCategory}
                        onChange={(event) =>
                          setEditCategory(
                            event.target.value
                          )
                        }
                      >
                        <option value="Work">
                          Work
                        </option>

                        <option value="Study">
                          Study
                        </option>

                        <option value="Personal">
                          Personal
                        </option>

                        <option value="Other">
                          Other
                        </option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label
                        htmlFor={`edit-date-${task.id}`}
                      >
                        Due Date
                      </label>

                      <input
                        id={`edit-date-${task.id}`}
                        type="date"
                        value={editDueDate}
                        onChange={(event) =>
                          setEditDueDate(
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label
                        htmlFor={`edit-duration-${task.id}`}
                      >
                        Duration
                      </label>

                      <input
                        id={`edit-duration-${task.id}`}
                        type="number"
                        value={editEstimatedDuration}
                        onChange={(event) =>
                          setEditEstimatedDuration(
                            event.target.value
                          )
                        }
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label
                        htmlFor={`edit-recurrence-${task.id}`}
                      >
                        Recurrence
                      </label>

                      <select
                        id={`edit-recurrence-${task.id}`}
                        value={editRecurrence}
                        onChange={(event) =>
                          setEditRecurrence(
                            event.target.value
                          )
                        }
                      >
                        <option value="None">
                          None
                        </option>

                        <option value="Daily">
                          Daily
                        </option>

                        <option value="Weekly">
                          Weekly
                        </option>

                        <option value="Monthly">
                          Monthly
                        </option>
                      </select>
                    </div>

                    <div className="edit-form-actions">
                      <button
                        className="primary-button"
                        type="submit"
                      >
                        Save Changes
                      </button>

                      <button
                        className="cancel-button"
                        type="button"
                        onClick={() =>
                          setEditingTaskId(null)
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
);
}

export default App;