"use client"

import { useState, useEffect } from "react"
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TaskColumn as TaskColumnComponent } from "./task-column"
import { fetchTaskBoard, createTaskColumn } from "@/lib/actions"

type TaskColumnType = {
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

type TaskBoard = {
  id: string
  projectId: string
  columns: TaskColumnType[]
}

interface TaskBoardProps {
  projectId: string
}

export function TaskBoard({ projectId }: TaskBoardProps) {
  const [taskBoard, setTaskBoard] = useState<TaskBoard | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState("")
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  useEffect(() => {
    const loadTaskBoard = async () => {
      try {
        const data = await fetchTaskBoard(projectId)
        setTaskBoard(data.taskBoard)
        setTasks(data.tasks)
      } catch (error) {
        // If no task board exists yet, we'll create one later
        console.error("Failed to load task board:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTaskBoard()
  }, [projectId])

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (!over) return

    if (active.id !== over.id) {
      // Handle task reordering or moving between columns
      // Implementation will go here
    }
  }

  const handleAddColumn = async () => {
    if (newColumnName.trim() === "") {
      toast({
        title: "Error",
        description: "Column name cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      const newColumn = await createTaskColumn(projectId, {
        name: newColumnName,
        order: taskBoard?.columns.length || 0,
      })

      if (!taskBoard) {
        // If we don't have a task board yet, this will create one
        const newTaskBoard = {
          id: newColumn.taskBoardId,
          projectId,
          columns: [newColumn],
        }
        setTaskBoard(newTaskBoard)
      } else {
        setTaskBoard({
          ...taskBoard,
          columns: [...taskBoard.columns, newColumn],
        })
      }

      setNewColumnName("")
      setIsAddingColumn(false)

      toast({
        title: "Success",
        description: "New column added",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new column",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40">Loading...</div>
  }

  if (!taskBoard) {
    return (
      <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg">
        <p className="text-muted-foreground mb-4">No task board yet</p>
        <Button onClick={() => setIsAddingColumn(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task Board
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Task Board</h4>
        {!isAddingColumn && (
          <Button variant="outline" size="sm" onClick={() => setIsAddingColumn(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Column
          </Button>
        )}
      </div>

      {isAddingColumn && (
        <div className="flex items-center gap-2">
          <Input
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            placeholder="Column name"
            className="h-9"
            autoFocus
          />
          <Button size="sm" onClick={handleAddColumn}>
            <Check className="h-4 w-4 mr-2" />
            Add
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsAddingColumn(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {taskBoard.columns
            .sort((a, b) => a.order - b.order)
            .map((column) => (
              <TaskColumnComponent
                key={column.id}
                column={column}
                tasks={tasks.filter((task) => task.columnId === column.id)}
                projectId={projectId}
              />
            ))}
        </div>
      </DndContext>
    </div>
  )
}

