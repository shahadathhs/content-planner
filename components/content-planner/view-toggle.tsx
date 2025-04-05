"use client"

import { LayoutGrid, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ViewToggleProps {
  view: "board" | "table"
  onChange: (view: "board" | "table") => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center border rounded-md p-1">
      <Button
        variant={view === "board" ? "default" : "ghost"}
        size="sm"
        className="h-8"
        onClick={() => onChange("board")}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Board
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        className="h-8"
        onClick={() => onChange("table")}
      >
        <Table2 className="h-4 w-4 mr-2" />
        Table
      </Button>
    </div>
  )
}

