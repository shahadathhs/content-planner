"use client"

import { useState, useEffect } from "react"
import { Draggable, Droppable } from "@hello-pangea/dnd"
import type { Layer as LayerType, Project } from "./content-planner"
import { ProjectCard } from "./project-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Check, X, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { updateLayer, deleteLayer, createProject, fetchProjectsByLayer } from "@/lib/actions"

interface LayerProps {
  stageId: string
  layer: LayerType
  index: number
  onOpenProject: (project: Project) => void
  onProjectsUpdated?: () => void
}

export function Layer({ stageId, layer, index, onOpenProject, onProjectsUpdated }: LayerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [layerName, setLayerName] = useState(layer.name)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadProjects = async () => {
    try {
      const data = await fetchProjectsByLayer(stageId, layer.id)
      setProjects(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [stageId, layer.id, toast])

  const handleSaveLayer = async () => {
    if (layerName.trim() === "") {
      toast({
        title: "Error",
        description: "Layer name cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      await updateLayer(stageId, layer.id, { name: layerName })
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Layer updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update layer",
        variant: "destructive",
      })
    }
  }

  const handleDeleteLayer = async () => {
    try {
      await deleteLayer(stageId, layer.id)
      toast({
        title: "Success",
        description: "Layer deleted",
      })
      if (onProjectsUpdated) {
        onProjectsUpdated()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete layer",
        variant: "destructive",
      })
    }
  }

  const handleAddProject = async () => {
    try {
      const newProject = await createProject({
        name: "New Project",
        description: "",
        stageId,
        layerId: layer.id,
        order: projects.length,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      setProjects([...projects, newProject])

      toast({
        title: "Success",
        description: "New project added",
      })

      if (onProjectsUpdated) {
        onProjectsUpdated()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new project",
        variant: "destructive",
      })
    }
  }

  return (
    <Draggable draggableId={`layer-${layer.id}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex flex-col bg-background rounded-lg p-3 min-w-[280px] max-w-[280px]"
        >
          <div className="flex items-center justify-between mb-3">
            {isEditing ? (
              <div className="flex items-center gap-2 w-full">
                <Input
                  value={layerName}
                  onChange={(e) => setLayerName(e.target.value)}
                  className="h-7 py-1 text-sm"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveLayer}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <div {...provided.dragHandleProps} className="cursor-grab mr-2">
                    <div className="h-4 w-1 bg-muted-foreground/30 rounded-full"></div>
                  </div>
                  <h4 className="font-medium text-sm">{layer.name}</h4>
                </div>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleAddProject}>
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
                      <DropdownMenuItem onClick={handleDeleteLayer} className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </div>

          <Droppable droppableId={`${stageId}-${layer.id}`} type="PROJECT">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-2 min-h-[100px]">
                {loading ? (
                  <div className="flex items-center justify-center h-20">
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-20 border border-dashed rounded-lg">
                    <span className="text-sm text-muted-foreground">No projects</span>
                    <Button variant="ghost" size="sm" className="mt-2" onClick={handleAddProject}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Project
                    </Button>
                  </div>
                ) : (
                  projects
                    .sort((a, b) => a.order - b.order)
                    .map((project, index) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        index={index}
                        onClick={() => onOpenProject(project)}
                      />
                    ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  )
}

