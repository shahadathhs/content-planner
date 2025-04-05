// Type definitions
export type Layer = {
  id: string;
  name: string;
  order: number;
};

export type Stage = {
  id: string;
  name: string;
  order: number;
  layers: Layer[];
};

export type Project = {
  id: string;
  name: string;
  description: string;
  stageId: string;
  layerId: string;
  order: number;
  tags: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskColumn = {
  id: string;
  name: string;
  order: number;
};

export type Task = {
  id: string;
  text: string;
  columnId: string;
  order: number;
  completed: boolean;
};

export type TaskBoard = {
  id: string;
  projectId: string;
  columns: TaskColumn[];
};

export type Template = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
};

export type ContentPlanner = {
  id: string;
  stages: Stage[];
};

// Helper function to generate unique IDs
export const generateId = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// Initialize localStorage with default data if empty
export const initializeLocalStorage = (): void => {
  if (typeof window === "undefined") return;

  // Check if content planner exists
  if (!localStorage.getItem("contentPlanner")) {
    const defaultLayerId1 = generateId();
    const defaultLayerId2 = generateId();
    const defaultLayerId3 = generateId();

    const defaultStageId = generateId();

    // Create default stage with layers
    const defaultStage: Stage = {
      id: defaultStageId,
      name: "Production",
      order: 0,
      layers: [
        { id: defaultLayerId1, name: "To Do", order: 0 },
        { id: defaultLayerId2, name: "In Progress", order: 1 },
        { id: defaultLayerId3, name: "Done", order: 2 },
      ],
    };

    // Create content planner
    const contentPlanner: ContentPlanner = {
      id: generateId(),
      stages: [defaultStage],
    };

    localStorage.setItem("contentPlanner", JSON.stringify(contentPlanner));

    // Initialize empty projects array
    localStorage.setItem("projects", JSON.stringify([]));

    // Initialize empty task boards array
    localStorage.setItem("taskBoards", JSON.stringify([]));

    // Initialize empty tasks array
    localStorage.setItem("tasks", JSON.stringify([]));

    // Initialize empty templates array
    localStorage.setItem("templates", JSON.stringify([]));
  }
};

// Get content planner
export const getContentPlanner = (): ContentPlanner | null => {
  if (typeof window === "undefined") return null;

  const contentPlannerJson = localStorage.getItem("contentPlanner");
  return contentPlannerJson ? JSON.parse(contentPlannerJson) : null;
};

// Update content planner
export const updateContentPlanner = (contentPlanner: ContentPlanner): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem("contentPlanner", JSON.stringify(contentPlanner));
};

// Get all projects
export const getProjects = (): Project[] => {
  if (typeof window === "undefined") return [];

  const projectsJson = localStorage.getItem("projects");
  return projectsJson ? JSON.parse(projectsJson) : [];
};

// Get projects by stage and layer
export const getProjectsByLayer = (
  stageId: string,
  layerId: string
): Project[] => {
  const projects = getProjects();
  return projects.filter(
    (project) => project.stageId === stageId && project.layerId === layerId
  );
};

// Add project
export const addProject = (project: Project): Project => {
  if (typeof window === "undefined") return project;

  const projects = getProjects();
  projects.push(project);
  localStorage.setItem("projects", JSON.stringify(projects));
  return project;
};

// Update project
export const updateProject = (
  projectId: string,
  updates: Partial<Project>
): Project | null => {
  if (typeof window === "undefined") return null;

  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === projectId);

  if (index === -1) return null;

  const updatedProject = {
    ...projects[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  projects[index] = updatedProject;

  localStorage.setItem("projects", JSON.stringify(projects));
  return updatedProject;
};

// Delete project
export const deleteProject = (projectId: string): boolean => {
  if (typeof window === "undefined") return false;

  const projects = getProjects();
  const filteredProjects = projects.filter((p) => p.id !== projectId);

  localStorage.setItem("projects", JSON.stringify(filteredProjects));

  // Also delete associated task board and tasks
  const taskBoards = getTaskBoards();
  const taskBoard = taskBoards.find((tb) => tb.projectId === projectId);

  if (taskBoard) {
    deleteTaskBoard(taskBoard.id);
  }

  return true;
};

// Get all task boards
export const getTaskBoards = (): TaskBoard[] => {
  if (typeof window === "undefined") return [];

  const taskBoardsJson = localStorage.getItem("taskBoards");
  return taskBoardsJson ? JSON.parse(taskBoardsJson) : [];
};

// Get task board by project ID
export const getTaskBoardByProjectId = (
  projectId: string
): TaskBoard | null => {
  const taskBoards = getTaskBoards();
  return taskBoards.find((tb) => tb.projectId === projectId) || null;
};

// Add task board
export const addTaskBoard = (taskBoard: TaskBoard): TaskBoard => {
  if (typeof window === "undefined") return taskBoard;

  const taskBoards = getTaskBoards();
  taskBoards.push(taskBoard);
  localStorage.setItem("taskBoards", JSON.stringify(taskBoards));
  return taskBoard;
};

// Update task board
export const updateTaskBoard = (
  taskBoardId: string,
  updates: Partial<TaskBoard>
): TaskBoard | null => {
  if (typeof window === "undefined") return null;

  const taskBoards = getTaskBoards();
  const index = taskBoards.findIndex((tb) => tb.id === taskBoardId);

  if (index === -1) return null;

  const updatedTaskBoard = { ...taskBoards[index], ...updates };
  taskBoards[index] = updatedTaskBoard;

  localStorage.setItem("taskBoards", JSON.stringify(taskBoards));
  return updatedTaskBoard;
};

// Delete task board
export const deleteTaskBoard = (taskBoardId: string): boolean => {
  if (typeof window === "undefined") return false;

  const taskBoards = getTaskBoards();
  const filteredTaskBoards = taskBoards.filter((tb) => tb.id !== taskBoardId);

  localStorage.setItem("taskBoards", JSON.stringify(filteredTaskBoards));

  // Also delete associated tasks
  const tasks = getTasks();
  const filteredTasks = tasks.filter((t) => t.columnId !== taskBoardId);

  localStorage.setItem("tasks", JSON.stringify(filteredTasks));

  return true;
};

// Get all tasks
export const getTasks = (): Task[] => {
  if (typeof window === "undefined") return [];

  const tasksJson = localStorage.getItem("tasks");
  return tasksJson ? JSON.parse(tasksJson) : [];
};

// Get tasks by task board ID
export const getTasksByTaskBoardId = (taskBoardId: string): Task[] => {
  const tasks = getTasks();
  return tasks.filter((task) => task.columnId === taskBoardId);
};

// Add task
export const addTask = (task: Task): Task => {
  if (typeof window === "undefined") return task;

  const tasks = getTasks();
  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  return task;
};

// Update task
export const updateTaskItem = (
  taskId: string,
  updates: Partial<Task>
): Task | null => {
  if (typeof window === "undefined") return null;

  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === taskId);

  if (index === -1) return null;

  const updatedTask = { ...tasks[index], ...updates };
  tasks[index] = updatedTask;

  localStorage.setItem("tasks", JSON.stringify(tasks));
  return updatedTask;
};

// Delete task
export const deleteTaskItem = (taskId: string): boolean => {
  if (typeof window === "undefined") return false;

  const tasks = getTasks();
  const filteredTasks = tasks.filter((t) => t.id !== taskId);

  localStorage.setItem("tasks", JSON.stringify(filteredTasks));
  return true;
};

// Get all templates
export const getTemplates = (): Template[] => {
  if (typeof window === "undefined") return [];

  const templatesJson = localStorage.getItem("templates");
  return templatesJson ? JSON.parse(templatesJson) : [];
};

// Add template
export const addTemplate = (template: Template): Template => {
  if (typeof window === "undefined") return template;

  const templates = getTemplates();
  templates.push(template);
  localStorage.setItem("templates", JSON.stringify(templates));
  return template;
};
