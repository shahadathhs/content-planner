import {
  generateId,
  getContentPlanner,
  updateContentPlanner,
  getProjects,
  getProjectsByLayer,
  addProject,
  updateProject as updateProjectInStorage,
  deleteProject as deleteProjectFromStorage,
  getTaskBoardByProjectId,
  addTaskBoard,
  updateTaskBoard,
  getTasks,
  addTask,
  updateTaskItem,
  deleteTaskItem,
  addTemplate,
  type TaskColumn,
  type Task,
  type Project,
  type Stage,
  type Layer,
} from "./local-storage";

// Content Planner Actions
export async function fetchContentPlanner() {
  const contentPlanner = getContentPlanner();

  if (!contentPlanner) {
    throw new Error("Content planner not found");
  }

  return contentPlanner;
}

// Stage Actions
export async function createStage(stageData: {
  name: string;
  order: number;
  layers: { id: string; name: string; order: number }[];
}) {
  const contentPlanner = getContentPlanner();

  if (!contentPlanner) {
    throw new Error("Content planner not found");
  }

  const newStage: Stage = {
    id: generateId(),
    name: stageData.name,
    order: stageData.order,
    layers: stageData.layers.map((layer) => ({
      id: layer.id || generateId(),
      name: layer.name,
      order: layer.order,
    })),
  };

  contentPlanner.stages.push(newStage);
  updateContentPlanner(contentPlanner);

  return newStage;
}

export async function updateStage(
  stageId: string,
  stageData: { name: string }
) {
  const contentPlanner = getContentPlanner();

  if (!contentPlanner) {
    throw new Error("Content planner not found");
  }

  const stageIndex = contentPlanner.stages.findIndex(
    (stage) => stage.id === stageId
  );

  if (stageIndex === -1) {
    throw new Error("Stage not found");
  }

  contentPlanner.stages[stageIndex].name = stageData.name;
  updateContentPlanner(contentPlanner);

  return contentPlanner.stages[stageIndex];
}

export async function deleteStage(stageId: string) {
  const contentPlanner = getContentPlanner();

  if (!contentPlanner) {
    throw new Error("Content planner not found");
  }

  // Delete all projects in this stage
  const projects = getProjects();
  const updatedProjects = projects.filter(
    (project) => project.stageId !== stageId
  );
  localStorage.setItem("projects", JSON.stringify(updatedProjects));

  // Remove the stage from the content planner
  contentPlanner.stages = contentPlanner.stages.filter(
    (stage) => stage.id !== stageId
  );
  updateContentPlanner(contentPlanner);

  return { success: true };
}

export async function updateStageOrder(
  stages: { id: string; order: number }[]
) {
  const contentPlanner = getContentPlanner();

  if (!contentPlanner) {
    throw new Error("Content planner not found");
  }

  // Update each stage's order
  contentPlanner.stages = contentPlanner.stages.map((stage) => {
    const updatedStage = stages.find((s) => s.id === stage.id);
    if (updatedStage) {
      return { ...stage, order: updatedStage.order };
    }
    return stage;
  });

  updateContentPlanner(contentPlanner);

  return { success: true };
}

// Layer Actions
export async function createLayer(
  stageId: string,
  layerData: { name: string; order: number }
) {
  const contentPlanner = getContentPlanner();

  if (!contentPlanner) {
    throw new Error("Content planner not found");
  }

  const stageIndex = contentPlanner.stages.findIndex(
    (stage) => stage.id === stageId
  );

  if (stageIndex === -1) {
    throw new Error("Stage not found");
  }

  const newLayer: Layer = {
    id: generateId(),
    name: layerData.name,
    order: layerData.order,
  };

  contentPlanner.stages[stageIndex].layers.push(newLayer);
  updateContentPlanner(contentPlanner);

  return newLayer;
}

export async function updateLayer(
  stageId: string,
  layerId: string,
  layerData: { name: string }
) {
  const contentPlanner = getContentPlanner();

  if (!contentPlanner) {
    throw new Error("Content planner not found");
  }

  const stageIndex = contentPlanner.stages.findIndex(
    (stage) => stage.id === stageId
  );

  if (stageIndex === -1) {
    throw new Error("Stage not found");
  }

  const layerIndex = contentPlanner.stages[stageIndex].layers.findIndex(
    (layer) => layer.id === layerId
  );

  if (layerIndex === -1) {
    throw new Error("Layer not found");
  }

  contentPlanner.stages[stageIndex].layers[layerIndex].name = layerData.name;
  updateContentPlanner(contentPlanner);

  return contentPlanner.stages[stageIndex].layers[layerIndex];
}

export async function deleteLayer(stageId: string, layerId: string) {
  const contentPlanner = getContentPlanner();

  if (!contentPlanner) {
    throw new Error("Content planner not found");
  }

  const stageIndex = contentPlanner.stages.findIndex(
    (stage) => stage.id === stageId
  );

  if (stageIndex === -1) {
    throw new Error("Stage not found");
  }

  // Delete all projects in this layer
  const projects = getProjects();
  const updatedProjects = projects.filter(
    (project) => !(project.stageId === stageId && project.layerId === layerId)
  );
  localStorage.setItem("projects", JSON.stringify(updatedProjects));

  // Remove the layer from the stage
  contentPlanner.stages[stageIndex].layers = contentPlanner.stages[
    stageIndex
  ].layers.filter((layer) => layer.id !== layerId);
  updateContentPlanner(contentPlanner);

  return { success: true };
}

// Project Actions
export async function createProject(projectData: {
  name: string;
  description: string;
  stageId: string;
  layerId: string;
  order: number;
  tags: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  const newProject: Project = {
    id: generateId(),
    name: projectData.name,
    description: projectData.description,
    stageId: projectData.stageId,
    layerId: projectData.layerId,
    order: projectData.order,
    tags: projectData.tags,
    dueDate: projectData.dueDate
      ? projectData.dueDate.toISOString()
      : undefined,
    createdAt: projectData.createdAt.toISOString(),
    updatedAt: projectData.updatedAt.toISOString(),
  };

  addProject(newProject);

  return newProject;
}

export async function fetchProjectsByLayer(stageId: string, layerId: string) {
  return getProjectsByLayer(stageId, layerId);
}

export async function updateProject(
  projectId: string,
  projectData: {
    name?: string;
    description?: string;
    tags?: string[];
    dueDate?: Date;
  }
) {
  const updates: Partial<Project> = {
    ...projectData,
    dueDate: projectData.dueDate
      ? projectData.dueDate.toISOString()
      : undefined,
    updatedAt: new Date().toISOString(),
  };

  const updatedProject = updateProjectInStorage(projectId, updates);

  if (!updatedProject) {
    throw new Error("Project not found");
  }

  return updatedProject;
}

export async function deleteProject(projectId: string) {
  const success = deleteProjectFromStorage(projectId);

  if (!success) {
    throw new Error("Failed to delete project");
  }

  return { success: true };
}

export async function saveProjectAsTemplate(projectId: string) {
  const projects = getProjects();
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  const template = {
    id: generateId(),
    name: `${project.name} Template`,
    description: project.description,
    tags: project.tags,
    createdAt: new Date().toISOString(),
  };

  addTemplate(template);

  return { success: true };
}

// Task Board Actions
export async function fetchTaskBoard(projectId: string) {
  let taskBoard = getTaskBoardByProjectId(projectId);
  let tasks: Task[] = [];

  if (!taskBoard) {
    // Create a default task board for this project
    taskBoard = {
      id: generateId(),
      projectId,
      columns: [],
    };

    addTaskBoard(taskBoard);
  } else {
    // Fetch tasks for this task board
    tasks = getTasks().filter((task) => task.columnId === taskBoard!.id);
  }

  return {
    taskBoard,
    tasks,
  };
}

export async function createTaskColumn(
  projectId: string,
  columnData: { name: string; order: number }
) {
  let taskBoard = getTaskBoardByProjectId(projectId);

  if (!taskBoard) {
    taskBoard = {
      id: generateId(),
      projectId,
      columns: [],
    };

    addTaskBoard(taskBoard);
  }

  const newColumn: TaskColumn = {
    id: generateId(),
    name: columnData.name,
    order: columnData.order,
  };

  taskBoard.columns.push(newColumn);
  updateTaskBoard(taskBoard.id, { columns: taskBoard.columns });

  return {
    ...newColumn,
    taskBoardId: taskBoard.id,
  };
}

export async function updateTaskColumn(
  projectId: string,
  columnId: string,
  columnData: { name: string }
) {
  const taskBoard = getTaskBoardByProjectId(projectId);

  if (!taskBoard) {
    throw new Error("Task board not found");
  }

  const columnIndex = taskBoard.columns.findIndex(
    (column) => column.id === columnId
  );

  if (columnIndex === -1) {
    throw new Error("Column not found");
  }

  taskBoard.columns[columnIndex].name = columnData.name;
  updateTaskBoard(taskBoard.id, { columns: taskBoard.columns });

  return taskBoard.columns[columnIndex];
}

export async function deleteTaskColumn(projectId: string, columnId: string) {
  const taskBoard = getTaskBoardByProjectId(projectId);

  if (!taskBoard) {
    throw new Error("Task board not found");
  }

  // Delete all tasks in this column
  const tasks = getTasks();
  const updatedTasks = tasks.filter((task) => task.columnId !== columnId);
  localStorage.setItem("tasks", JSON.stringify(updatedTasks));

  // Remove the column from the task board
  taskBoard.columns = taskBoard.columns.filter(
    (column) => column.id !== columnId
  );
  updateTaskBoard(taskBoard.id, { columns: taskBoard.columns });

  return { success: true };
}

// Task Actions
export async function createTask(
  projectId: string,
  taskData: {
    text: string;
    columnId: string;
    order: number;
    completed: boolean;
  }
) {
  const taskBoard = getTaskBoardByProjectId(projectId);

  if (!taskBoard) {
    throw new Error("Task board not found");
  }

  const newTask: Task = {
    id: generateId(),
    text: taskData.text,
    columnId: taskData.columnId,
    order: taskData.order,
    completed: taskData.completed,
  };

  addTask(newTask);

  return newTask;
}

export async function updateTask(
  projectId: string,
  taskId: string,
  taskData: {
    text?: string;
    completed?: boolean;
  }
) {
  const updatedTask = updateTaskItem(taskId, taskData);

  if (!updatedTask) {
    throw new Error("Task not found");
  }

  return updatedTask;
}

export async function deleteTask(projectId: string, taskId: string) {
  const success = deleteTaskItem(taskId);

  if (!success) {
    throw new Error("Failed to delete task");
  }

  return { success: true };
}
