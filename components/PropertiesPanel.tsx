'use client'
import type { CanvasItem } from '@/app/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Bold, Italic, Underline, Plus, Minus, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react'
import { TablePropertiesPanel } from './TablePropertiesPanel'

interface PropertiesPanelProps {
  selectedItems: CanvasItem[]
  onUpdateProperties: (properties: any) => void
  tabType: 'design' | 'content'
}

const fontFamilies = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New']

export function PropertiesPanel({ selectedItems, onUpdateProperties, tabType }: PropertiesPanelProps) {
  if (!selectedItems || selectedItems.length === 0) {
    return (
      <div className='p-4'>
        <div className='text-center text-gray-500 mt-8'>
          <div className='text-2xl mb-2'>⚙️</div>
          <p className='text-sm'>Select element(s) to edit properties</p>
        </div>
      </div>
    )
  }

  if (selectedItems.length > 1) {
    return (
      <div className='p-4'>
        <div className='text-center text-gray-500 mt-8'>
          <div className='text-2xl mb-2'>📦</div>
          <p className='text-sm'>{selectedItems.length} items selected</p>
          <p className='text-xs mt-2 text-gray-400'>Multi-selection editing coming soon</p>
        </div>
      </div>
    )
  }

  const selectedItem = selectedItems[0]

  // Helper functions for text formatting
  const toggleBold = () => {
    const currentWeight = selectedItem.properties.fontWeight
    const newWeight = currentWeight === 'bold' ? 'normal' : 'bold'
    onUpdateProperties({ fontWeight: newWeight })
  }

  const toggleItalic = () => {
    const currentStyle = selectedItem.properties.fontStyle
    const newStyle = currentStyle === 'italic' ? 'normal' : 'italic'
    onUpdateProperties({ fontStyle: newStyle })
  }

  const toggleUnderline = () => {
    const currentDecoration = selectedItem.properties.textDecoration
    const newDecoration = currentDecoration === 'underline' ? 'none' : 'underline'
    onUpdateProperties({ textDecoration: newDecoration })
  }

  // Check if text formatting is applicable
  const isTextFormattingApplicable = ['text', 'button', 'label', 'checkbox', 'radio', 'fieldset'].includes(
    selectedItem.type,
  )

  // Tab management for tabbar
  const addTab = () => {
    const currentTabs = selectedItem.properties.tabs || ['Tab 1', 'Tab 2', 'Tab 3']
    const newTabs = [...currentTabs, `Tab ${currentTabs.length + 1}`]
    onUpdateProperties({ tabs: newTabs })
  }

  const removeTab = () => {
    const currentTabs = selectedItem.properties.tabs || ['Tab 1', 'Tab 2', 'Tab 3']
    if (currentTabs.length > 1) {
      const newTabs = currentTabs.slice(0, -1)
      const activeTab = selectedItem.properties.activeTab || 0
      onUpdateProperties({
        tabs: newTabs,
        activeTab: activeTab >= newTabs.length ? newTabs.length - 1 : activeTab,
      })
    }
  }

  const updateTab = (index: number, value: string) => {
    const currentTabs = selectedItem.properties.tabs || ['Tab 1', 'Tab 2', 'Tab 3']
    const newTabs = [...currentTabs]
    newTabs[index] = value
    onUpdateProperties({ tabs: newTabs })
  }

  return (
    <div className='p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto'>
      <h3 className='text-sm font-medium mb-4 text-gray-700'>Properties</h3>

      {/* Font Family */}
      {isTextFormattingApplicable && (
        <div className='space-y-2'>
          <Label className='text-xs text-gray-600'>Font Family</Label>
          <Select
            value={selectedItem.properties.fontFamily || 'Arial'}
            onValueChange={value => onUpdateProperties({ fontFamily: value })}
          >
            <SelectTrigger className='h-8 text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map(font => (
                <SelectItem key={font} value={font} className='text-xs'>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Font Size */}
      {isTextFormattingApplicable && (
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label className='text-xs text-gray-600'>Font Size</Label>
            <div className='flex items-center space-x-1'>
              <Input
                type='number'
                value={selectedItem.properties.fontSize || 14}
                onChange={e => onUpdateProperties({ fontSize: Number.parseInt(e.target.value) })}
                className='w-16 h-6 text-xs text-center'
              />
              <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                <Plus className='w-3 h-3' />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Text Formatting */}
      {isTextFormattingApplicable && (
        <div className='space-y-2'>
          <div className='flex space-x-1'>
            <Button
              variant={selectedItem.properties.fontWeight === 'bold' ? 'default' : 'outline'}
              size='sm'
              onClick={toggleBold}
              className={`h-7 w-7 p-0 ${selectedItem.properties.fontWeight === 'bold' ? 'bg-gray-700 text-white' : ''}`}
            >
              <Bold className='w-3 h-3' />
            </Button>
            <Button
              variant={selectedItem.properties.fontStyle === 'italic' ? 'default' : 'outline'}
              size='sm'
              onClick={toggleItalic}
              className={`h-7 w-7 p-0 ${
                selectedItem.properties.fontStyle === 'italic' ? 'bg-gray-700 text-white' : ''
              }`}
            >
              <Italic className='w-3 h-3' />
            </Button>
            <Button
              variant={selectedItem.properties.textDecoration === 'underline' ? 'default' : 'outline'}
              size='sm'
              onClick={toggleUnderline}
              className={`h-7 w-7 p-0 ${
                selectedItem.properties.textDecoration === 'underline' ? 'bg-gray-700 text-white' : ''
              }`}
            >
              <Underline className='w-3 h-3' />
            </Button>
            <Button variant='outline' size='sm' className='h-7 w-7 p-0 bg-transparent'>
              <Type className='w-3 h-3' />
            </Button>
          </div>
          <div className='flex space-x-1'>
            <Button
              variant={selectedItem.properties.textAlign === 'left' ? 'default' : 'outline'}
              size='sm'
              onClick={() => onUpdateProperties({ textAlign: 'left' })}
              className={`h-7 w-7 p-0 ${selectedItem.properties.textAlign === 'left' ? 'bg-gray-700 text-white' : ''}`}
            >
              <AlignLeft className='w-3 h-3' />
            </Button>
            <Button
              variant={selectedItem.properties.textAlign === 'center' ? 'default' : 'outline'}
              size='sm'
              onClick={() => onUpdateProperties({ textAlign: 'center' })}
              className={`h-7 w-7 p-0 ${
                selectedItem.properties.textAlign === 'center' ? 'bg-gray-700 text-white' : ''
              }`}
            >
              <AlignCenter className='w-3 h-3' />
            </Button>
            <Button
              variant={selectedItem.properties.textAlign === 'right' ? 'default' : 'outline'}
              size='sm'
              onClick={() => onUpdateProperties({ textAlign: 'right' })}
              className={`h-7 w-7 p-0 ${selectedItem.properties.textAlign === 'right' ? 'bg-gray-700 text-white' : ''}`}
            >
              <AlignRight className='w-3 h-3' />
            </Button>
          </div>
        </div>
      )}

      {/* Position */}
      <div className='space-y-2'>
        <Label className='text-xs text-gray-600'>Position:</Label>
        <div className='grid grid-cols-2 gap-2'>
          <div>
            <Label className='text-xs text-gray-500'>X:</Label>
            <Input
              type='number'
              value={Math.round(selectedItem.x)}
              onChange={e => onUpdateProperties({ x: Number.parseInt(e.target.value) || 0 })}
              className='h-6 text-xs'
            />
          </div>
          <div>
            <Label className='text-xs text-gray-500'>Y:</Label>
            <Input
              type='number'
              value={Math.round(selectedItem.y)}
              onChange={e => onUpdateProperties({ y: Number.parseInt(e.target.value) || 0 })}
              className='h-6 text-xs'
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div className='space-y-2'>
        <Label className='text-xs text-gray-600'>Size</Label>
        <div className='grid grid-cols-2 gap-2'>
          <div>
            <Label className='text-xs text-gray-500'>width:</Label>
            <Input
              type='number'
              value={Math.round(selectedItem.width)}
              onChange={e => onUpdateProperties({ width: Number.parseInt(e.target.value) || 1 })}
              className='h-6 text-xs'
            />
          </div>
          <div>
            <Label className='text-xs text-gray-500'>height:</Label>
            <Input
              type='number'
              value={Math.round(selectedItem.height)}
              onChange={e => onUpdateProperties({ height: Number.parseInt(e.target.value) || 1 })}
              className='h-6 text-xs'
            />
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <div className='space-y-2'>
        <Label className='text-xs text-gray-600'>Color</Label>
        <div className='grid grid-cols-8 gap-1'>
          {[
            '#1d4d35',
            '#2d5d45',
            '#3d6d55',
            '#4d7d65',
            '#5d8d75',
            '#6d9d85',
            '#7dad95',
            '#8dbda5',
            '#1a4a32',
            '#2a5a42',
            '#3a6a52',
            '#4a7a62',
            '#5a8a72',
            '#6a9a82',
            '#7aaa92',
            '#8abaa2',
            '#174731',
            '#275741',
            '#376751',
            '#477761',
            '#578771',
            '#679781',
            '#77a791',
            '#87b7a1',
            '#144430',
            '#245440',
            '#346450',
            '#447460',
            '#548470',
            '#649480',
            '#74a490',
            '#84b4a0',
            '#114129',
            '#215139',
            '#316149',
            '#417159',
            '#518169',
            '#619179',
            '#71a189',
            '#81b199',
            '#0e3e28',
            '#1e4e38',
            '#2e5e48',
            '#3e6e58',
            '#4e7e68',
            '#5e8e78',
            '#6e9e88',
            '#7eae98',
          ].map(color => (
            <button
              key={color}
              className='w-6 h-6 rounded border border-gray-300 hover:border-gray-400'
              style={{ backgroundColor: color }}
              onClick={() => onUpdateProperties({ color })}
            />
          ))}
        </div>
      </div>

      {/* Text Content */}
      {(selectedItem.type === 'text' || selectedItem.type === 'button' || selectedItem.type === 'label') && (
        <div className='space-y-2'>
          <Label className='text-xs text-gray-600'>Text</Label>
          <Input
            value={selectedItem.properties.text || ''}
            onChange={e => onUpdateProperties({ text: e.target.value })}
            placeholder='Enter text...'
            className='h-8 text-xs'
          />
        </div>
      )}

      {/* Input/Textarea Properties */}
      {(selectedItem.type === 'input' || selectedItem.type === 'textarea') && (
        <>
          <div className='space-y-2'>
            <Label className='text-xs text-gray-600'>Placeholder</Label>
            <Input
              value={selectedItem.properties.placeholder || ''}
              onChange={e => onUpdateProperties({ placeholder: e.target.value })}
              placeholder='Enter placeholder...'
              className='h-8 text-xs'
            />
          </div>
          {selectedItem.type === 'input' && (
            <div className='space-y-2'>
              <Label className='text-xs text-gray-600'>Value</Label>
              <Input
                value={selectedItem.properties.value || ''}
                onChange={e => onUpdateProperties({ value: e.target.value })}
                placeholder='Enter value...'
                className='h-8 text-xs'
              />
            </div>
          )}
          {selectedItem.type === 'input' && (
            <div className='flex items-center space-x-2'>
              <Checkbox
                id={`prop-readonly-${selectedItem.id}`}
                checked={selectedItem.properties.readonly || false}
                onCheckedChange={checked => onUpdateProperties({ readonly: checked })}
              />
              <Label htmlFor={`prop-readonly-${selectedItem.id}`} className='text-xs text-gray-600'>
                Read Only
              </Label>
            </div>
          )}
        </>
      )}

      {/* Checkbox Properties */}
      {selectedItem.type === 'checkbox' && (
        <>
          <div className='space-y-2'>
            <Label className='text-xs text-gray-600'>Label</Label>
            <Input
              value={selectedItem.properties.label || ''}
              onChange={e => onUpdateProperties({ label: e.target.value })}
              placeholder='Enter label (leave empty for checkbox only)'
              className='h-8 text-xs'
            />
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              checked={selectedItem.properties.checked || false}
              onCheckedChange={checked => onUpdateProperties({ checked })}
            />
            <Label className='text-xs text-gray-600'>Checked</Label>
          </div>
        </>
      )}

      {/* Radio Properties */}
      {selectedItem.type === 'radio' && (
        <>
          <div className='space-y-2'>
            <Label className='text-xs text-gray-600'>Label</Label>
            <Input
              value={selectedItem.properties.label || ''}
              onChange={e => onUpdateProperties({ label: e.target.value })}
              placeholder='Enter label (leave empty for radio only)'
              className='h-8 text-xs'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-xs text-gray-600'>Group Name</Label>
            <Input
              value={selectedItem.properties.name || ''}
              onChange={e => onUpdateProperties({ name: e.target.value })}
              placeholder='radioGroup'
              className='h-8 text-xs'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-xs text-gray-600'>Value</Label>
            <Input
              value={selectedItem.properties.value || ''}
              onChange={e => onUpdateProperties({ value: e.target.value })}
              placeholder='option1'
              className='h-8 text-xs'
            />
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              checked={selectedItem.properties.checked || false}
              onCheckedChange={checked => onUpdateProperties({ checked })}
            />
            <Label className='text-xs text-gray-600'>Selected</Label>
          </div>
        </>
      )}

      {/* Textarea Rows */}
      {selectedItem.type === 'textarea' && (
        <div className='space-y-2'>
          <Label className='text-xs text-gray-600'>Rows</Label>
          <Input
            type='number'
            value={selectedItem.properties.rows || 4}
            onChange={e => onUpdateProperties({ rows: Number.parseInt(e.target.value) })}
            min='1'
            className='h-8 text-xs'
          />
        </div>
      )}

      {/* Tab Bar Management */}
      {selectedItem.type === 'tabbar' && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label className='text-xs text-gray-600'>Tabs</Label>
            <div className='flex space-x-1'>
              <Button variant='outline' size='sm' onClick={addTab} className='h-6 w-6 p-0 bg-transparent'>
                <Plus className='w-3 h-3' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={removeTab}
                disabled={(selectedItem.properties.tabs || []).length <= 1}
                className='h-6 w-6 p-0 bg-transparent'
              >
                <Minus className='w-3 h-3' />
              </Button>
            </div>
          </div>

          <div className='space-y-2'>
            {(selectedItem.properties.tabs || ['Tab 1', 'Tab 2', 'Tab 3']).map((tab: string, index: number) => (
              <div key={index} className='flex items-center space-x-2'>
                <Input
                  value={tab}
                  onChange={e => updateTab(index, e.target.value)}
                  placeholder={`Tab ${index + 1}`}
                  className='flex-1 h-6 text-xs'
                />
                <Checkbox
                  checked={(selectedItem.properties.activeTab || 0) === index}
                  onCheckedChange={checked => {
                    if (checked) {
                      onUpdateProperties({ activeTab: index })
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fieldset Properties */}
      {selectedItem.type === 'fieldset' && (
        <div className='space-y-2'>
          <Label className='text-xs text-gray-600'>Legend</Label>
          <Input
            value={selectedItem.properties.legend || ''}
            onChange={e => onUpdateProperties({ legend: e.target.value })}
            placeholder='Field Set'
            className='h-8 text-xs'
          />
        </div>
      )}

      {/* Search Button Text */}
      {selectedItem.type === 'searchbutton' && (
        <div className='space-y-2'>
          <Label className='text-xs text-gray-600'>Button Text</Label>
          <Input
            value={selectedItem.properties.text || ''}
            onChange={e => onUpdateProperties({ text: e.target.value })}
            placeholder='Search'
            className='h-8 text-xs'
          />
        </div>
      )}

      {/* Table Properties */}
      {selectedItem.type === 'table' && (
        <>
          <div className='space-y-2'>
            <Label className='text-xs text-gray-600'>Rows</Label>
            <Input
              type='number'
              value={selectedItem.properties.rows || 3}
              onChange={e => onUpdateProperties({ rows: Number.parseInt(e.target.value) })}
              min='1'
              className='h-8 text-xs'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-xs text-gray-600'>Columns</Label>
            <Input
              type='number'
              value={selectedItem.properties.columns || 3}
              onChange={e => onUpdateProperties({ columns: Number.parseInt(e.target.value) })}
              min='1'
              className='h-8 text-xs'
            />
          </div>
          <TablePropertiesPanel item={selectedItem} onUpdateProperties={onUpdateProperties} />
        </>
      )}

      {/* Select Options */}
      {selectedItem.type === 'select' && (
        <div className='space-y-2'>
          <Label className='text-xs text-gray-600'>Options (one per line)</Label>
          <textarea
            value={(selectedItem.properties.options || []).join('\n')}
            onChange={e => onUpdateProperties({ options: e.target.value.split('\n').filter(opt => opt.trim()) })}
            placeholder='Option 1\nOption 2\nOption 3'
            className='w-full h-20 p-2 border border-gray-300 rounded text-xs'
          />
        </div>
      )}
    </div>
  )
}
