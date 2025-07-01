import { useDraggable } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'

const components = [
  { id: 'label', label: 'Label' },
  { id: 'input', label: 'Textbox' },
  { id: 'button', label: 'Button' },
  { id: 'checkbox', label: 'Checkbox' },
  { id: 'checkbox-label', label: 'Checkbox Label' },
  { id: 'radio', label: 'Radio' },
  { id: 'radio-label', label: 'Radio Label' },
  { id: 'table', label: 'Table' },
  { id: 'select', label: 'Selectbox' },
  { id: 'searchbutton', label: 'Button search' },
  { id: 'textarea', label: 'Textarea' },
  { id: 'tabbar', label: 'Tab Bar' },
  { id: 'fieldset', label: 'Field Set' },
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
      variant='outline'
      size='sm'
      className={`
        bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400
        cursor-grab active:cursor-grabbing h-7 px-3 text-xs font-normal
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      {label}
    </Button>
  )
}

export function ComponentLibrary() {
  return (
    <div className='flex flex-wrap gap-1'>
      {components.map(component => (
        <DraggableComponent key={component.id} id={component.id} label={component.label} />
      ))}
    </div>
  )
}
