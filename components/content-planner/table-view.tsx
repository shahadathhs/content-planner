"use client"

import { useState } from "react"
import type { Stage, Project } from "./content-planner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"
import { format } from "date-fns"
import { createProject } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

interface TableViewProps {
  stages: Stage[]
  onOpenProject: (project: Project) => void
}

export function TableView({ stages, onOpenProject }: TableViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // This would normally fetch all projects, but for simplicity we'll assume they're passed in
  // In a real implementation, you'd fetch all projects here

  const handleAddProject = async () => {
    if (stages.length === 0) {
      toast({
        title: "Error",
        description: "You need to create a stage first",
        variant: "destructive",
      })
      return
    }

    try {
      const firstStage = stages[0]
      const firstLayer = firstStage.layers[0]

      const newProject = await createProject({
        name: "New Project",
        description: "",
        stageId: firstStage.id,
        layerId: firstLayer.id,
        order: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      setProjects([...projects, newProject])

      toast({
        title: "Success",
        description: "New project added",
      })

      // Open the new project for editing
      onOpenProject(newProject)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new project",
        variant: "destructive",
      })
    }
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleAddProject}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Layer</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading projects...
                </TableCell>
              </TableRow>
            ) : filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No projects found
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => {
                const stage = stages.find((s) => s.id === project.stageId)
                const layer = stage?.layers.find((l) => l.id === project.layerId)

                return (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onOpenProject(project)}
                  >
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{stage?.name || "Unknown"}</TableCell>
                    <TableCell>{layer?.name || "Unknown"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{project.dueDate ? format(new Date(project.dueDate), "MMM d, yyyy") : "-"}</TableCell>
                    <TableCell>{format(new Date(project.updatedAt), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

