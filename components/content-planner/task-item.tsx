"use client"

import { useState } from "react"
import { Draggable } from "@hello-pangea/dnd"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, X, Trash, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateTask, deleteTask } from "@/lib/actions"

type Task = {
  id: string
  text: string
  columnId: string
  order: number
  completed: boolean
}

interface TaskItemProps {
  task: Task
  projectId: string
  index: number
  onTaskUpdated: () => Promise<void>
}

export function TaskItem({ task, projectId, index, onTaskUpdated }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [taskText, setTaskText] = useState(task.text)
  const [completed, setCompleted] = useState(task.completed)
  const { toast } = useToast()

  const handleSaveTask = async () => {
    if (taskText.trim() === "") {
      toast({
        title: "Error",
        description: "Task text cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      await updateTask(projectId, task.id, { text: taskText })
      setIsEditing(false)
      await onTaskUpdated()

      toast({
        title: "Success",
        description: "Task updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async () => {
    try {
      await deleteTask(projectId, task.id)
      await onTaskUpdated()

      toast({
        title: "Success",
        description: "Task deleted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    }
  }

  const handleToggleCompleted = async () => {
    const newCompletedState = !completed
    setCompleted(newCompletedState)

    try {
      await updateTask(projectId, task.id, { completed: newCompletedState })
      await onTaskUpdated()
    } catch (error) {
      setCompleted(completed) // Revert on error
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
    }
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-background border rounded-md p-2 cursor-grab shadow-sm"
        >
          {isEditing ? (
            <div className="space-y-2">
              <Input value={taskText} onChange={(e) => setTaskText(e.target.value)} className="text-xs h-7" autoFocus />
              <div className="flex gap-1">
                <Button size="sm" className="h-6 text-xs px-2" onClick={handleSaveTask}>
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setIsEditing(false)}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <Checkbox
                id={`task-${task.id}`}
                checked={completed}
                onCheckedChange={handleToggleCompleted}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={`task-${task.id}`}
                  className={`text-xs ${completed ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.text}
                </label>
              </div>
              <div className="flex gap-1 ml-2">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={handleDeleteTask}>
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}

