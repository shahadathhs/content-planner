"use client";

import { useState } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Layer } from "./layer";
import type { Stage as StageType, Project } from "./content-planner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripHorizontal, Trash, Check, X, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { updateStage, deleteStage, createLayer } from "@/lib/actions";

interface StageProps {
  stage: StageType;
  index: number;
  onOpenProject: (project: Project) => void;
  onStagesUpdated?: () => void;
}

export function Stage({
  stage,
  index,
  onOpenProject,
  onStagesUpdated,
}: StageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [stageName, setStageName] = useState(stage.name);
  const { toast } = useToast();

  const handleSaveStage = async () => {
    if (stageName.trim() === "") {
      toast({
        title: "Error",
        description: "Stage name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateStage(stage.id, { name: stageName });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Stage updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stage",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStage = async () => {
    try {
      await deleteStage(stage.id);
      toast({
        title: "Success",
        description: "Stage deleted",
      });
      if (onStagesUpdated) {
        onStagesUpdated();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete stage",
        variant: "destructive",
      });
    }
  };

  const handleAddLayer = async () => {
    try {
      const newLayer = await createLayer(stage.id, {
        name: "New Layer",
        order: stage.layers.length,
      });

      toast({
        title: "Success",
        description: "New layer added",
      });

      if (onStagesUpdated) {
        onStagesUpdated();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new layer",
        variant: "destructive",
      });
    }
  };

  return (
    <Draggable draggableId={stage.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex flex-col bg-muted/30 rounded-lg p-4 w-full mb-8 h-fit"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div {...provided.dragHandleProps} className="cursor-grab">
                <GripHorizontal className="h-5 w-5 text-muted-foreground" />
              </div>

              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    className="h-8 py-1"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveStage}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <h3 className="font-medium text-lg">{stage.name}</h3>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddLayer}>
                  Add Layer
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteStage}
                  className="text-destructive"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Droppable droppableId={stage.id} direction="horizontal" type="LAYER">
            {(provided) => (
              <div
                className="flex gap-4 overflow-x-auto pb-2"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {stage.layers
                  .sort((a, b) => a.order - b.order)
                  .map((layer, index) => (
                    <Layer
                      key={layer.id}
                      stageId={stage.id}
                      layer={layer}
                      index={index}
                      onOpenProject={onOpenProject}
                      onProjectsUpdated={onStagesUpdated}
                    />
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
}
