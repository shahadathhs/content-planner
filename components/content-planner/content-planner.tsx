"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Stage as StageComponent } from "./stage";
import { CardModal } from "./card-modal";
import { ViewToggle } from "./view-toggle";
import { TableView } from "./table-view";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createStage,
  fetchContentPlanner,
  updateStageOrder,
} from "@/lib/actions";
import {
  initializeLocalStorage,
  getProjects,
  updateProject as updateProjectInStorage,
} from "@/lib/local-storage";

// Types
export type Layer = {
  id: string;
  name: string;
  order: number;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  stageId: string;
  layerId: string;
  order: number;
  tags: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type Stage = {
  id: string;
  name: string;
  order: number;
  layers: Layer[];
};

export type ContentPlannerType = {
  id: string;
  stages: Stage[];
};

export default function ContentPlanner() {
  const [contentPlanner, setContentPlanner] =
    useState<ContentPlannerType | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [view, setView] = useState<"board" | "table">("board");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const { toast } = useToast();

  const loadContentPlanner = async () => {
    try {
      const data = await fetchContentPlanner();
      setContentPlanner(data);
      // Also load all projects for the table view
      const allProjects = getProjects();
      setProjects(allProjects);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load content planner",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize localStorage if needed
    initializeLocalStorage();
    loadContentPlanner();
  }, [toast]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    // If there's no destination or the item was dropped back in its original position
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    // Handle stage reordering
    if (type === "STAGE") {
      const newStages = Array.from(contentPlanner!.stages);
      const [removed] = newStages.splice(source.index, 1);
      newStages.splice(destination.index, 0, removed);

      // Update the order property for each stage
      const updatedStages = newStages.map((stage, index) => ({
        ...stage,
        order: index,
      }));

      setContentPlanner({
        ...contentPlanner!,
        stages: updatedStages,
      });

      try {
        await updateStageOrder(updatedStages);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update stage order",
          variant: "destructive",
        });
      }
    }

    // Handle project movement between layers/stages
    if (type === "PROJECT") {
      const allProjects = getProjects();
      const projectToMove = allProjects.find((p) => p.id === draggableId);

      if (!projectToMove) return;

      // Parse the source and destination IDs to get stageId and layerId
      const [sourceStageId, sourceLayerId] = source.droppableId.split("-");
      const [destStageId, destLayerId] = destination.droppableId.split("-");

      // Get projects in source and destination layers
      const sourceProjects = allProjects
        .filter(
          (p) => p.stageId === sourceStageId && p.layerId === sourceLayerId
        )
        .sort((a, b) => a.order - b.order);

      const destProjects = allProjects
        .filter((p) => p.stageId === destStageId && p.layerId === destLayerId)
        .sort((a, b) => a.order - b.order);

      // Remove project from source
      sourceProjects.splice(source.index, 1);

      // Update project with new stageId and layerId
      const updatedProject = {
        ...projectToMove,
        stageId: destStageId,
        layerId: destLayerId,
      };

      // Add project to destination
      destProjects.splice(destination.index, 0, updatedProject);

      // Update order for all affected projects
      sourceProjects.forEach((project, index) => {
        updateProjectInStorage(project.id, { order: index });
      });

      destProjects.forEach((project, index) => {
        updateProjectInStorage(project.id, {
          order: index,
          stageId: project.id === draggableId ? destStageId : project.stageId,
          layerId: project.id === draggableId ? destLayerId : project.layerId,
        });
      });

      // Force a refresh to show the updated state
      await loadContentPlanner();
    }
  };

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
      });

      setContentPlanner({
        ...contentPlanner!,
        stages: [...(contentPlanner?.stages || []), newStage],
      });

      toast({
        title: "Success",
        description: "New stage added",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new stage",
        variant: "destructive",
      });
    }
  };

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleCloseProject = () => {
    setSelectedProject(null);
    // Refresh data when closing a project in case it was updated
    loadContentPlanner();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!contentPlanner) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">No Content Planner Found</h1>
        <Button onClick={handleAddStage}>Create Content Planner</Button>
      </div>
    );
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="stages" direction="horizontal" type="STAGE">
            {(provided) => (
              <div
                className="pb-4 gap-6"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {contentPlanner.stages
                  .sort((a, b) => a.order - b.order)
                  .map((stage, index) => (
                    <StageComponent
                      key={stage.id}
                      stage={stage}
                      index={index}
                      onOpenProject={handleOpenProject}
                      onStagesUpdated={loadContentPlanner}
                    />
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <TableView
          stages={contentPlanner.stages}
          projects={projects}
          onOpenProject={handleOpenProject}
        />
      )}

      {selectedProject && (
        <CardModal project={selectedProject} onClose={handleCloseProject} />
      )}
    </div>
  );
}
