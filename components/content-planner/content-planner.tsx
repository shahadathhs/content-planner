"use client"

import { useState, useEffect } from "react"
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { Stage as StageComponent } from "./stage"
import { CardModal } from "./card-modal"
import { ViewToggle } from "./view-toggle"
import { TableView } from "./table-view"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createStage, fetchContentPlanner, updateStageOrder } from "@/lib/actions"

// Types
export type Layer = {
  id: string
  name: string
  order: number
}

export type Project = {
  id: string
  name: string
  description: string
  stageId: string
  layerId: string
  order: number
  tags: string[]
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

export type Stage = {
  id: string
  name: string
  order: number
  layers: Layer[]
}

export type ContentPlannerType = {
  id: string
  stages: Stage[]
}

export default function ContentPlanner() {
  const [contentPlanner, setContentPlanner] = useState<ContentPlannerType | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<any>(null)
  const [activeItemType, setActiveItemType] = useState<"stage" | "project" | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [view, setView] = useState<"board" | "table">("board")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  useEffect(() => {
    const loadContentPlanner = async () => {
      try {
        const data = await fetchContentPlanner()
        setContentPlanner(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load content planner",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadContentPlanner()
  }, [toast])

  const handleDragStart = (event: any) => {
    const { active } = event
    setActiveId(active.id)

    // Determine if we're dragging a stage or a project
    if (active.data.current?.type === "stage") {
      setActiveItemType("stage")
      setActiveItem(contentPlanner?.stages.find((stage) => stage.id === active.id))
    } else if (active.data.current?.type === "project") {
      setActiveItemType("project")
      setActiveItem(active.data.current.project)
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setActiveItem(null)
      setActiveItemType(null)
      return
    }

    // Handle stage reordering
    if (activeItemType === "stage" && over.data.current?.type === "stage") {
      if (active.id !== over.id) {
        const oldIndex = contentPlanner!.stages.findIndex((stage) => stage.id === active.id)
        const newIndex = contentPlanner!.stages.findIndex((stage) => stage.id === over.id)

        const newStages = arrayMove(contentPlanner!.stages, oldIndex, newIndex)

        // Update the order property for each stage
        const updatedStages = newStages.map((stage, index) => ({
          ...stage,
          order: index,
        }))

        setContentPlanner({
          ...contentPlanner!,
          stages: updatedStages,
        })

        try {
          await updateStageOrder(updatedStages)
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to update stage order",
            variant: "destructive",
          })
        }
      }
    }

    // Handle project movement between layers/stages
    if (activeItemType === "project") {
      // Implementation for project movement will go here
      // This would involve updating the project's stageId and layerId
    }

    setActiveId(null)
    setActiveItem(null)
    setActiveItemType(null)
  }

  const handleAddStage = async () => {
    try {
      const newStage = await createStage({
        name: "New Stage",
        order: contentPlanner?.stages.length || 0,
        layers: [
          { id: crypto.randomUUID(), name: "To Do", order: 0 },
          { id: crypto.randomUUID(), name: "In Progress", order: 1 },
          { id: crypto.randomUUID(), name: "Done", order: 2 },
        ],
      })

      setContentPlanner({
        ...contentPlanner!,
        stages: [...(contentPlanner?.stages || []), newStage],
      })

      toast({
        title: "Success",
        description: "New stage added",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new stage",
        variant: "destructive",
      })
    }
  }

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project)
  }

  const handleCloseProject = () => {
    setSelectedProject(null)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!contentPlanner) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">No Content Planner Found</h1>
        <Button onClick={handleAddStage}>Create Content Planner</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Content Planner</h1>
        <div className="flex items-center gap-4">
          <ViewToggle view={view} onChange={setView} />
          <Button onClick={handleAddStage} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Stage
          </Button>
        </div>
      </div>

      {view === "board" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex overflow-x-auto pb-4 gap-6">
            {contentPlanner.stages
              .sort((a, b) => a.order - b.order)
              .map((stage) => (
                <StageComponent key={stage.id} stage={stage} onOpenProject={handleOpenProject} />
              ))}
          </div>

          <DragOverlay>
            {activeId && activeItemType === "stage" && activeItem ? (
              <div className="bg-background border rounded-lg p-4 shadow-lg opacity-80 w-80">
                <h3 className="font-medium text-lg">{activeItem.name}</h3>
              </div>
            ) : null}
            {activeId && activeItemType === "project" && activeItem ? (
              <div className="bg-background border rounded-lg p-4 shadow-lg opacity-80 w-72">
                <h3 className="font-medium">{activeItem.name}</h3>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <TableView stages={contentPlanner.stages} onOpenProject={handleOpenProject} />
      )}

      {selectedProject && <CardModal project={selectedProject} onClose={handleCloseProject} />}
    </div>
  )
}

