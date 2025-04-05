"use server"

import { revalidatePath } from "next/cache"
import { connectToDatabase } from "./db"
import {
  ContentPlannerModel,
  StageModel,
  ProjectModel,
  TaskBoardModel,
  TaskColumnModel,
  TaskModel,
  TemplateModel,
} from "./models"

// Content Planner Actions
export async function fetchContentPlanner() {
  try {
    await connectToDatabase()

    // Find or create a content planner
    let contentPlanner = await ContentPlannerModel.findOne().populate({
      path: "stages",
      populate: {
        path: "layers",
      },
    })

    if (!contentPlanner) {
      // Create a default content planner with one stage
      const defaultStage = new StageModel({
        name: "Production",
        order: 0,
        layers: [
          { name: "To Do", order: 0 },
          { name: "In Progress", order: 1 },
          { name: "Done", order: 2 },
        ],
      })

      await defaultStage.save()

      contentPlanner = new ContentPlannerModel({
        stages: [defaultStage._id],
      })

      await contentPlanner.save()

      // Fetch the newly created content planner with populated stages
      contentPlanner = await ContentPlannerModel.findById(contentPlanner._id).populate({
        path: "stages",
        populate: {
          path: "layers",
        },
      })
    }

    return {
      id: contentPlanner._id.toString(),
      stages: contentPlanner.stages.map((stage) => ({
        id: stage._id.toString(),
        name: stage.name,
        order: stage.order,
        layers: stage.layers.map((layer) => ({
          id: layer._id.toString(),
          name: layer.name,
          order: layer.order,
        })),
      })),
    }
  } catch (error) {
    console.error("Error fetching content planner:", error)
    throw new Error("Failed to fetch content planner")
  }
}

// Stage Actions
export async function createStage(stageData: {
  name: string
  order: number
  layers: { id: string; name: string; order: number }[]
}) {
  try {
    await connectToDatabase()

    // Create the stage
    const stage = new StageModel({
      name: stageData.name,
      order: stageData.order,
      layers: stageData.layers.map((layer) => ({
        name: layer.name,
        order: layer.order,
      })),
    })

    await stage.save()

    // Add the stage to the content planner
    const contentPlanner = await ContentPlannerModel.findOne()
    contentPlanner.stages.push(stage._id)
    await contentPlanner.save()

    // Return the created stage with its layers
    return {
      id: stage._id.toString(),
      name: stage.name,
      order: stage.order,
      layers: stage.layers.map((layer) => ({
        id: layer._id.toString(),
        name: layer.name,
        order: layer.order,
      })),
    }
  } catch (error) {
    console.error("Error creating stage:", error)
    throw new Error("Failed to create stage")
  }
}

export async function updateStage(stageId: string, stageData: { name: string }) {
  try {
    await connectToDatabase()

    const stage = await StageModel.findByIdAndUpdate(stageId, { name: stageData.name }, { new: true })

    revalidatePath("/")

    return {
      id: stage._id.toString(),
      name: stage.name,
      order: stage.order,
    }
  } catch (error) {
    console.error("Error updating stage:", error)
    throw new Error("Failed to update stage")
  }
}

export async function deleteStage(stageId: string) {
  try {
    await connectToDatabase()

    // Delete all projects in this stage
    await ProjectModel.deleteMany({ stageId })

    // Delete the stage
    await StageModel.findByIdAndDelete(stageId)

    // Remove the stage from the content planner
    const contentPlanner = await ContentPlannerModel.findOne()
    contentPlanner.stages = contentPlanner.stages.filter((id) => id.toString() !== stageId)
    await contentPlanner.save()

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting stage:", error)
    throw new Error("Failed to delete stage")
  }
}

export async function updateStageOrder(stages: { id: string; order: number }[]) {
  try {
    await connectToDatabase()

    // Update each stage's order
    for (const stage of stages) {
      await StageModel.findByIdAndUpdate(stage.id, { order: stage.order })
    }

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error updating stage order:", error)
    throw new Error("Failed to update stage order")
  }
}

// Layer Actions
export async function createLayer(stageId: string, layerData: { name: string; order: number }) {
  try {
    await connectToDatabase()

    const stage = await StageModel.findById(stageId)

    const newLayer = {
      name: layerData.name,
      order: layerData.order,
    }

    stage.layers.push(newLayer)
    await stage.save()

    // Get the newly created layer
    const createdLayer = stage.layers[stage.layers.length - 1]

    revalidatePath("/")

    return {
      id: createdLayer._id.toString(),
      name: createdLayer.name,
      order: createdLayer.order,
    }
  } catch (error) {
    console.error("Error creating layer:", error)
    throw new Error("Failed to create layer")
  }
}

export async function updateLayer(stageId: string, layerId: string, layerData: { name: string }) {
  try {
    await connectToDatabase()

    const stage = await StageModel.findById(stageId)
    const layer = stage.layers.id(layerId)

    layer.name = layerData.name
    await stage.save()

    revalidatePath("/")

    return {
      id: layer._id.toString(),
      name: layer.name,
      order: layer.order,
    }
  } catch (error) {
    console.error("Error updating layer:", error)
    throw new Error("Failed to update layer")
  }
}

export async function deleteLayer(stageId: string, layerId: string) {
  try {
    await connectToDatabase()

    // Delete all projects in this layer
    await ProjectModel.deleteMany({ stageId, layerId })

    // Remove the layer from the stage
    const stage = await StageModel.findById(stageId)
    stage.layers.pull({ _id: layerId })
    await stage.save()

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting layer:", error)
    throw new Error("Failed to delete layer")
  }
}

// Project Actions
export async function createProject(projectData: {
  name: string
  description: string
  stageId: string
  layerId: string
  order: number
  tags: string[]
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}) {
  try {
    await connectToDatabase()

    const project = new ProjectModel(projectData)
    await project.save()

    revalidatePath("/")

    return {
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      stageId: project.stageId,
      layerId: project.layerId,
      order: project.order,
      tags: project.tags,
      dueDate: project.dueDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }
  } catch (error) {
    console.error("Error creating project:", error)
    throw new Error("Failed to create project")
  }
}

export async function fetchProjectsByLayer(stageId: string, layerId: string) {
  try {
    await connectToDatabase()

    const projects = await ProjectModel.find({ stageId, layerId })

    return projects.map((project) => ({
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      stageId: project.stageId,
      layerId: project.layerId,
      order: project.order,
      tags: project.tags,
      dueDate: project.dueDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }))
  } catch (error) {
    console.error("Error fetching projects:", error)
    throw new Error("Failed to fetch projects")
  }
}

export async function updateProject(
  projectId: string,
  projectData: {
    name?: string
    description?: string
    tags?: string[]
    dueDate?: Date
  },
) {
  try {
    await connectToDatabase()

    const project = await ProjectModel.findByIdAndUpdate(
      projectId,
      {
        ...projectData,
        updatedAt: new Date(),
      },
      { new: true },
    )

    revalidatePath("/")

    return {
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      stageId: project.stageId,
      layerId: project.layerId,
      order: project.order,
      tags: project.tags,
      dueDate: project.dueDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }
  } catch (error) {
    console.error("Error updating project:", error)
    throw new Error("Failed to update project")
  }
}

export async function deleteProject(projectId: string) {
  try {
    await connectToDatabase()

    // Delete the project's task board and tasks
    const taskBoard = await TaskBoardModel.findOne({ projectId })
    if (taskBoard) {
      await TaskModel.deleteMany({ taskBoardId: taskBoard._id })
      await TaskBoardModel.findByIdAndDelete(taskBoard._id)
    }

    // Delete the project
    await ProjectModel.findByIdAndDelete(projectId)

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting project:", error)
    throw new Error("Failed to delete project")
  }
}

export async function saveProjectAsTemplate(projectId: string) {
  try {
    await connectToDatabase()

    const project = await ProjectModel.findById(projectId)

    // Create a template from the project
    const template = new TemplateModel({
      name: `${project.name} Template`,
      description: project.description,
      tags: project.tags,
      createdAt: new Date(),
    })

    await template.save()

    // If the project has a task board, copy its structure to the template
    const taskBoard = await TaskBoardModel.findOne({ projectId })
    if (taskBoard) {
      // Copy task columns and their tasks
      // Implementation would go here
    }

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error saving project as template:", error)
    throw new Error("Failed to save project as template")
  }
}

// Task Board Actions
export async function fetchTaskBoard(projectId: string) {
  try {
    await connectToDatabase()

    let taskBoard = await TaskBoardModel.findOne({ projectId }).populate("columns")
    let tasks = []

    if (!taskBoard) {
      // Create a default task board for this project
      taskBoard = new TaskBoardModel({
        projectId,
        columns: [],
      })

      await taskBoard.save()
    } else {
      // Fetch tasks for this task board
      tasks = await TaskModel.find({ taskBoardId: taskBoard._id })
    }

    return {
      taskBoard: {
        id: taskBoard._id.toString(),
        projectId: taskBoard.projectId,
        columns: taskBoard.columns.map((column) => ({
          id: column._id.toString(),
          name: column.name,
          order: column.order,
        })),
      },
      tasks: tasks.map((task) => ({
        id: task._id.toString(),
        text: task.text,
        columnId: task.columnId,
        order: task.order,
        completed: task.completed,
      })),
    }
  } catch (error) {
    console.error("Error fetching task board:", error)
    throw new Error("Failed to fetch task board")
  }
}

export async function createTaskColumn(projectId: string, columnData: { name: string; order: number }) {
  try {
    await connectToDatabase()

    // Find or create the task board for this project
    let taskBoard = await TaskBoardModel.findOne({ projectId })

    if (!taskBoard) {
      taskBoard = new TaskBoardModel({
        projectId,
        columns: [],
      })

      await taskBoard.save()
    }

    // Create the column
    const column = new TaskColumnModel({
      name: columnData.name,
      order: columnData.order,
    })

    await column.save()

    // Add the column to the task board
    taskBoard.columns.push(column._id)
    await taskBoard.save()

    revalidatePath("/")

    return {
      id: column._id.toString(),
      name: column.name,
      order: column.order,
      taskBoardId: taskBoard._id.toString(),
    }
  } catch (error) {
    console.error("Error creating task column:", error)
    throw new Error("Failed to create task column")
  }
}

export async function updateTaskColumn(projectId: string, columnId: string, columnData: { name: string }) {
  try {
    await connectToDatabase()

    const column = await TaskColumnModel.findByIdAndUpdate(columnId, { name: columnData.name }, { new: true })

    revalidatePath("/")

    return {
      id: column._id.toString(),
      name: column.name,
      order: column.order,
    }
  } catch (error) {
    console.error("Error updating task column:", error)
    throw new Error("Failed to update task column")
  }
}

export async function deleteTaskColumn(projectId: string, columnId: string) {
  try {
    await connectToDatabase()

    // Delete all tasks in this column
    await TaskModel.deleteMany({ columnId })

    // Delete the column
    await TaskColumnModel.findByIdAndDelete(columnId)

    // Remove the column from the task board
    const taskBoard = await TaskBoardModel.findOne({ projectId })
    taskBoard.columns = taskBoard.columns.filter((id) => id.toString() !== columnId)
    await taskBoard.save()

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting task column:", error)
    throw new Error("Failed to delete task column")
  }
}

// Task Actions
export async function createTask(
  projectId: string,
  taskData: {
    text: string
    columnId: string
    order: number
    completed: boolean
  },
) {
  try {
    await connectToDatabase()

    // Find the task board for this project
    const taskBoard = await TaskBoardModel.findOne({ projectId })

    if (!taskBoard) {
      throw new Error("Task board not found")
    }

    // Create the task
    const task = new TaskModel({
      text: taskData.text,
      columnId: taskData.columnId,
      order: taskData.order,
      completed: taskData.completed,
      taskBoardId: taskBoard._id,
    })

    await task.save()

    revalidatePath("/")

    return {
      id: task._id.toString(),
      text: task.text,
      columnId: task.columnId,
      order: task.order,
      completed: task.completed,
    }
  } catch (error) {
    console.error("Error creating task:", error)
    throw new Error("Failed to create task")
  }
}

export async function updateTask(
  projectId: string,
  taskId: string,
  taskData: {
    text?: string
    completed?: boolean
  },
) {
  try {
    await connectToDatabase()

    const task = await TaskModel.findByIdAndUpdate(taskId, taskData, { new: true })

    revalidatePath("/")

    return {
      id: task._id.toString(),
      text: task.text,
      columnId: task.columnId,
      order: task.order,
      completed: task.completed,
    }
  } catch (error) {
    console.error("Error updating task:", error)
    throw new Error("Failed to update task")
  }
}

export async function deleteTask(projectId: string, taskId: string) {
  try {
    await connectToDatabase()

    await TaskModel.findByIdAndDelete(taskId)

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting task:", error)
    throw new Error("Failed to delete task")
  }
}

