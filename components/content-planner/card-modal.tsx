"use client"

import { useState, useRef, useEffect } from "react"
import type { Project } from "./content-planner"
import { TaskBoard } from "./task-board"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { X, CalendarIcon, Tag, Save, Trash } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { updateProject, deleteProject, saveProjectAsTemplate } from "@/lib/actions"

interface CardModalProps {
  project: Project
  onClose: () => void
}

export function CardModal({ project, onClose }: CardModalProps) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [tags, setTags] = useState<string[]>(project.tags)
  const [tagInput, setTagInput] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(project.dueDate ? new Date(project.dueDate) : undefined)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  const handleSave = async () => {
    if (name.trim() === "") {
      toast({
        title: "Error",
        description: "Project name cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      await updateProject(project.id, {
        name,
        description,
        tags,
        dueDate,
      })

      toast({
        title: "Success",
        description: "Project updated",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProject(project.id)
      toast({
        title: "Success",
        description: "Project deleted",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      })
    }
  }

  const handleSaveAsTemplate = async () => {
    try {
      await saveProjectAsTemplate(project.id)
      toast({
        title: "Success",
        description: "Project saved as template",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save project as template",
        variant: "destructive",
      })
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-end">
      <div ref={modalRef} className="bg-background border-l w-full max-w-2xl h-full overflow-y-auto shadow-lg">
        <div className="sticky top-0 bg-background z-10 border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Project Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setIsEditing(true)
                }}
                className="text-xl font-semibold h-auto py-2 px-3"
                placeholder="Project Name"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center border rounded-md pr-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  className="border-0 h-8"
                  placeholder="Add tag"
                />
                <Tag className="h-4 w-4 text-muted-foreground" />
              </div>

              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="px-2 py-1">
                  <span>{tag}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      handleRemoveTag(tag)
                      setIsEditing(true)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                    onClick={() => setIsEditing(true)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Set due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date)
                      setIsEditing(true)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {dueDate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDueDate(undefined)
                    setIsEditing(true)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div>
              <Textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setIsEditing(true)
                }}
                className="min-h-[200px]"
                placeholder="Project description..."
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Tasks</h3>
            <TaskBoard projectId={project.id} />
          </div>

          <div className="flex justify-between pt-4 border-t">
            <div>
              <Button variant="outline" onClick={handleSaveAsTemplate}>
                Save as Template
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDelete}>
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button onClick={handleSave} disabled={!isEditing || isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

