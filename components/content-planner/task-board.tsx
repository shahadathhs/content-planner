"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TaskColumn as TaskColumnComponent } from "./task-column";
import { fetchTaskBoard, createTaskColumn } from "@/lib/actions";
import { getTasks, updateTaskItem } from "@/lib/local-storage";

type TaskColumnType = {
  id: string;
  name: string;
  order: number;
};

type Task = {
  id: string;
  text: string;
  columnId: string;
  order: number;
  completed: boolean;
};

type TaskBoard = {
  id: string;
  projectId: string;
  columns: TaskColumnType[];
};

interface TaskBoardProps {
  projectId: string;
}

export function TaskBoard({ projectId }: TaskBoardProps) {
  const [taskBoard, setTaskBoard] = useState<TaskBoard | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const { toast } = useToast();
  const [isAddingTask, setIsAddingTask] = useState(false);

  const loadTaskBoard = async () => {
    try {
      const data = await fetchTaskBoard(projectId);
      setTaskBoard(data.taskBoard);
      setTasks(data.tasks);
    } catch (error) {
      // If no task board exists yet, we'll create one later
      console.error("Failed to load task board:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaskBoard();
  }, [projectId]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "TASK") {
      const allTasks = getTasks();
      const taskToMove = allTasks.find((t) => t.id === draggableId);

      if (!taskToMove) return;

      // Get tasks in source and destination columns
      const sourceColumnTasks = allTasks
        .filter((t) => t.columnId === source.droppableId)
        .sort((a, b) => a.order - b.order);

      const destColumnTasks =
        source.droppableId === destination.droppableId
          ? sourceColumnTasks
          : allTasks
              .filter((t) => t.columnId === destination.droppableId)
              .sort((a, b) => a.order - b.order);

      // Remove task from source
      sourceColumnTasks.splice(source.index, 1);

      // Add task to destination
      if (source.droppableId === destination.droppableId) {
        sourceColumnTasks.splice(destination.index, 0, taskToMove);
      } else {
        destColumnTasks.splice(destination.index, 0, {
          ...taskToMove,
          columnId: destination.droppableId,
        });
      }

      // Update order for all affected tasks
      sourceColumnTasks.forEach((task, index) => {
        updateTaskItem(task.id, { order: index });
      });

      if (source.droppableId !== destination.droppableId) {
        destColumnTasks.forEach((task, index) => {
          updateTaskItem(task.id, {
            order: index,
            columnId:
              task.id === draggableId ? destination.droppableId : task.columnId,
          });
        });
      }

      // Refresh tasks
      loadTaskBoard();
    }
  };

  const handleAddColumn = async () => {
    if (newColumnName.trim() === "") {
      toast({
        title: "Error",
        description: "Column name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const newColumn = await createTaskColumn(projectId, {
        name: newColumnName,
        order: taskBoard?.columns.length || 0,
      });

      if (!taskBoard) {
        // If we don't have a task board yet, this will create one
        const newTaskBoard = {
          id: newColumn.taskBoardId,
          projectId,
          columns: [newColumn],
        };
        setTaskBoard(newTaskBoard);
      } else {
        setTaskBoard({
          ...taskBoard,
          columns: [...taskBoard.columns, newColumn],
        });
      }

      setNewColumnName("");
      setIsAddingTask(false);

      toast({
        title: "Success",
        description: "New column added",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new column",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">Loading...</div>
    );
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Task Board</h4>
        {!isAddingColumn && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingColumn(true)}
          >
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingColumn(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div
              className="flex gap-4 overflow-x-auto pb-2"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {taskBoard.columns
                .sort((a, b) => a.order - b.order)
                .map((column, index) => (
                  <TaskColumnComponent
                    key={column.id}
                    column={column}
                    tasks={tasks.filter((task) => task.columnId === column.id)}
                    projectId={projectId}
                    index={index}
                    onTaskCreated={loadTaskBoard}
                  />
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
