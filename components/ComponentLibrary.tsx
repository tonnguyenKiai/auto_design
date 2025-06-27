import { useDraggable } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"

const components = [
  { id: "text", label: "Text" },
  { id: "button", label: "Button" },
  { id: "input", label: "Input" },
  { id: "table", label: "Table" },
  { id: "select", label: "Select" },
  { id: "label", label: "Label" },
  { id: "checkbox", label: "Checkbox" },
  { id: "radio", label: "Radio" },
  { id: "textarea", label: "Textarea" },
  { id: "tabbar", label: "Tab Bar" },
  { id: "fieldset", label: "Field Set" },
  { id: "searchbutton", label: "Search" },
]

function DraggableComponent({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <Button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      variant="outline"
      className={`
      bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700
      cursor-grab active:cursor-grabbing
      ${isDragging ? "opacity-50" : ""}
    `}
    >
      {label}
    </Button>
  )
}

export function ComponentLibrary() {
  return (
    <div className="grid grid-cols-7 gap-2">
      {components.map((component) => (
        <DraggableComponent key={component.id} id={component.id} label={component.label} />
      ))}
    </div>
  )
}
