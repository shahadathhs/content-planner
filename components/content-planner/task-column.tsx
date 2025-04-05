"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Check, X, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { TaskItem } from "./task-item"
import { updateTaskColumn, deleteTaskColumn, createTask } from "@/lib/actions"

type TaskColumn = {
  id: string
  name: string
  order: number
}

type Task = {
  id: string
  text: string
  columnId: string
  order: number
  completed: boolean
}

interface TaskColumnProps {
  column: TaskColumn
  tasks: Task[]
  projectId: string
}

export function TaskColumn({ column, tasks, projectId }: TaskColumnProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [columnName, setColumnName] = useState(column.name)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskText, setNewTaskText] = useState("")
  const { toast } = useToast()

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSaveColumn = async () => {
    if (columnName.trim() === "") {
      toast({
        title: "Error",
        description: "Column name cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      await updateTaskColumn(projectId, column.id, { name: columnName })
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Column updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update column",
        variant: "destructive",
      })
    }
  }

  const handleDeleteColumn = async () => {
    try {
      await deleteTaskColumn(projectId, column.id)
      toast({
        title: "Success",
        description: "Column deleted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete column",
        variant: "destructive",
      })
    }
  }

  const handleAddTask = async () => {
    if (newTaskText.trim() === "") {
      toast({
        title: "Error",
        description: "Task text cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      await createTask(projectId, {
        text: newTaskText,
        columnId: column.id,
        order: tasks.length,
        completed: false,
      })

      setNewTaskText("")
      setIsAddingTask(false)

      toast({
        title: "Success",
        description: "New task added",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new task",
        variant: "destructive",
      })
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col bg-muted/30 rounded-lg p-3 min-w-[250px] max-w-[250px]"
    >
      <div className="flex items-center justify-between mb-3">
        {isEditing ? (
          <div className="flex items-center gap-2 w-full">
            <Input
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              className="h-7 py-1 text-sm"
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveColumn}>
              <Check className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <h4 className="font-medium text-sm">{column.name}</h4>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsAddingTask(true)}>
                <Plus className="h-3 w-3" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>Rename</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteColumn} className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>

      {isAddingTask && (
        <div className="mb-3">
          <Input
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Task text"
            className="text-sm mb-2"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddTask()
              }
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleAddTask}>
              Add
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsAddingTask(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 min-h-[50px]">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-20 border border-dashed rounded-lg">
            <span className="text-xs text-muted-foreground">No tasks</span>
          </div>
        ) : (
          tasks
            .sort((a, b) => a.order - b.order)
            .map((task) => <TaskItem key={task.id} task={task} projectId={projectId} />)
        )}
      </div>
    </div>
  )
}

