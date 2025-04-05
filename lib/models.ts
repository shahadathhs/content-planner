import mongoose, { Schema } from "mongoose"

// Layer Schema (embedded in Stage)
const LayerSchema = new Schema({
  name: { type: String, required: true },
  order: { type: Number, required: true },
})

// Stage Schema
const StageSchema = new Schema({
  name: { type: String, required: true },
  order: { type: Number, required: true },
  layers: [LayerSchema],
})

// Content Planner Schema
const ContentPlannerSchema = new Schema({
  stages: [{ type: Schema.Types.ObjectId, ref: "Stage" }],
})

// Project Schema
const ProjectSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  stageId: { type: String, required: true },
  layerId: { type: String, required: true },
  order: { type: Number, required: true },
  tags: [{ type: String }],
  dueDate: { type: Date },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
})

// Task Column Schema
const TaskColumnSchema = new Schema({
  name: { type: String, required: true },
  order: { type: Number, required: true },
})

// Task Board Schema
const TaskBoardSchema = new Schema({
  projectId: { type: String, required: true, unique: true },
  columns: [{ type: Schema.Types.ObjectId, ref: "TaskColumn" }],
})

// Task Schema
const TaskSchema = new Schema({
  text: { type: String, required: true },
  columnId: { type: String, required: true },
  order: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  taskBoardId: { type: Schema.Types.ObjectId, ref: "TaskBoard", required: true },
})

// Template Schema
const TemplateSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  tags: [{ type: String }],
  createdAt: { type: Date, required: true },
})

// Create or get models
export const ContentPlannerModel =
  mongoose.models.ContentPlanner || mongoose.model("ContentPlanner", ContentPlannerSchema)
export const StageModel = mongoose.models.Stage || mongoose.model("Stage", StageSchema)
export const ProjectModel = mongoose.models.Project || mongoose.model("Project", ProjectSchema)
export const TaskBoardModel = mongoose.models.TaskBoard || mongoose.model("TaskBoard", TaskBoardSchema)
export const TaskColumnModel = mongoose.models.TaskColumn || mongoose.model("TaskColumn", TaskColumnSchema)
export const TaskModel = mongoose.models.Task || mongoose.model("Task", TaskSchema)
export const TemplateModel = mongoose.models.Template || mongoose.model("Template", TemplateSchema)

// We don't need to export LayerModel since it's embedded in StageModel
export const LayerModel = null

