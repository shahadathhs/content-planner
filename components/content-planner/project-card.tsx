"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Project } from "./content-planner"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { CalendarClock } from "lucide-react"

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: project.id,
    data: {
      type: "project",
      project,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const hasDueDate = project.dueDate !== undefined
  const dueDate = hasDueDate ? new Date(project.dueDate!) : null
  const isOverdue = dueDate && dueDate < new Date()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-card border rounded-md p-3 cursor-grab shadow-sm hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <h4 className="font-medium text-sm mb-2 line-clamp-2">{project.name}</h4>

      {project.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{project.description}</p>}

      <div className="flex flex-wrap gap-1 mb-2">
        {project.tags.map((tag, index) => (
          <Badge key={index} variant="outline" className="text-xs py-0 h-5">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="flex justify-between items-center text-xs text-muted-foreground">
        {hasDueDate ? (
          <div className="flex items-center">
            <CalendarClock className="h-3 w-3 mr-1" />
            <span className={isOverdue ? "text-destructive" : ""}>
              {formatDistanceToNow(dueDate!, { addSuffix: true })}
            </span>
          </div>
        ) : (
          <span></span>
        )}

        <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
      </div>
    </div>
  )
}

