'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  arrayMove
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Card, Text, Stack } from '@mantine/core';
import type { WorkoutProgram, ProgramBlock, ProgramWeek, ProgramDay } from '../../types/index';

interface DragDropProgramBuilderProps {
  program: WorkoutProgram;
  onUpdateProgram: (program: WorkoutProgram) => void;
  children: (dragProps: DragDropContextProps) => React.ReactNode;
}

interface DragDropContextProps {
  draggedItem: DraggedItem | null;
  isDragging: boolean;
}

interface DraggedItem {
  type: 'block' | 'week' | 'day';
  id: string;
  data: ProgramBlock | ProgramWeek | ProgramDay;
  source: {
    blockIndex?: number;
    weekIndex?: number;
    dayIndex?: number;
  };
}

export function DragDropProgramBuilder({ 
  program, 
  onUpdateProgram, 
  children 
}: DragDropProgramBuilderProps) {
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    
    setIsDragging(true);
    
    // Parse the drag ID to understand what's being dragged
    const [type, ...idParts] = activeId.split('-');
    const id = idParts.join('-');
    
    if (type === 'block') {
      const blockIndex = program.blocks.findIndex(block => block.blockId === id);
      if (blockIndex !== -1) {
        setDraggedItem({
          type: 'block',
          id,
          data: program.blocks[blockIndex],
          source: { blockIndex }
        });
      }
    } else if (type === 'week') {
      // Find week across all blocks
      for (let blockIndex = 0; blockIndex < program.blocks.length; blockIndex++) {
        const weekIndex = program.blocks[blockIndex].weeks.findIndex(week => week.weekId === id);
        if (weekIndex !== -1) {
          setDraggedItem({
            type: 'week',
            id,
            data: program.blocks[blockIndex].weeks[weekIndex],
            source: { blockIndex, weekIndex }
          });
          break;
        }
      }
    } else if (type === 'day') {
      // Find day across all blocks and weeks
      for (let blockIndex = 0; blockIndex < program.blocks.length; blockIndex++) {
        for (let weekIndex = 0; weekIndex < program.blocks[blockIndex].weeks.length; weekIndex++) {
          const dayIndex = program.blocks[blockIndex].weeks[weekIndex].days.findIndex(day => day.dayId === id);
          if (dayIndex !== -1) {
            setDraggedItem({
              type: 'day',
              id,
              data: program.blocks[blockIndex].weeks[weekIndex].days[dayIndex],
              source: { blockIndex, weekIndex, dayIndex }
            });
            return;
          }
        }
      }
    }
  }, [program]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setIsDragging(false);
    setDraggedItem(null);
    
    if (!over || !draggedItem) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) return;
    
    // Parse the over ID to understand where we're dropping
    const [overType, ...overIdParts] = overId.split('-');
    const overItemId = overIdParts.join('-');
    
    const updatedProgram = { ...program };
    
    if (draggedItem.type === 'block' && overType === 'block') {
      // Reorder blocks
      const oldIndex = draggedItem.source.blockIndex!;
      const newIndex = updatedProgram.blocks.findIndex(block => block.blockId === overItemId);
      
      if (oldIndex !== newIndex && newIndex !== -1) {
        updatedProgram.blocks = arrayMove(updatedProgram.blocks, oldIndex, newIndex);
        // Update order indices
        updatedProgram.blocks.forEach((block, index) => {
          block.orderIndex = index;
        });
        onUpdateProgram(updatedProgram);
      }
    } else if (draggedItem.type === 'week' && overType === 'week') {
      // Reorder weeks within the same block
      const { blockIndex: sourceBlockIndex, weekIndex: sourceWeekIndex } = draggedItem.source;
      
      // Find target block and week
      for (let blockIndex = 0; blockIndex < updatedProgram.blocks.length; blockIndex++) {
        const targetWeekIndex = updatedProgram.blocks[blockIndex].weeks.findIndex(week => week.weekId === overItemId);
        if (targetWeekIndex !== -1) {
          // Only allow reordering within the same block for now
          if (blockIndex === sourceBlockIndex && sourceWeekIndex !== targetWeekIndex) {
            updatedProgram.blocks[blockIndex].weeks = arrayMove(
              updatedProgram.blocks[blockIndex].weeks,
              sourceWeekIndex!,
              targetWeekIndex
            );
            // Update week numbers
            updatedProgram.blocks[blockIndex].weeks.forEach((week, index) => {
              week.weekNumber = index + 1;
            });
            onUpdateProgram(updatedProgram);
          }
          break;
        }
      }
    } else if (draggedItem.type === 'day' && overType === 'day') {
      // Reorder days within the same week
      const { blockIndex: sourceBlockIndex, weekIndex: sourceWeekIndex, dayIndex: sourceDayIndex } = draggedItem.source;
      
      // Find target block, week, and day
      for (let blockIndex = 0; blockIndex < updatedProgram.blocks.length; blockIndex++) {
        for (let weekIndex = 0; weekIndex < updatedProgram.blocks[blockIndex].weeks.length; weekIndex++) {
          const targetDayIndex = updatedProgram.blocks[blockIndex].weeks[weekIndex].days.findIndex(day => day.dayId === overItemId);
          if (targetDayIndex !== -1) {
            // Only allow reordering within the same week for now
            if (blockIndex === sourceBlockIndex && weekIndex === sourceWeekIndex && sourceDayIndex !== targetDayIndex) {
              updatedProgram.blocks[blockIndex].weeks[weekIndex].days = arrayMove(
                updatedProgram.blocks[blockIndex].weeks[weekIndex].days,
                sourceDayIndex!,
                targetDayIndex
              );
              onUpdateProgram(updatedProgram);
            }
            return;
          }
        }
      }
    }
  }, [draggedItem, program, onUpdateProgram]);

  const renderDragOverlay = () => {
    if (!draggedItem) return null;
    
    const item = draggedItem.data;
    
    return (
      <Card withBorder p="sm" style={{ 
        opacity: 0.8, 
        transform: 'rotate(5deg)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <Stack gap="xs">
          {draggedItem.type === 'block' && (
            <>
              <Text fw={600} size="sm">Block: {(item as ProgramBlock).name}</Text>
              <Text size="xs" c="dimmed">
                {(item as ProgramBlock).weeks.length} weeks
              </Text>
            </>
          )}
          {draggedItem.type === 'week' && (
            <>
              <Text fw={600} size="sm">Week {(item as ProgramWeek).weekNumber}</Text>
              <Text size="xs" c="dimmed">
                {(item as ProgramWeek).days.length} days
              </Text>
            </>
          )}
          {draggedItem.type === 'day' && (
            <>
              <Text fw={600} size="sm">
                {getDayName((item as ProgramDay).dayOfWeek)}
              </Text>
              <Text size="xs" c="dimmed">
                {(item as ProgramDay).activities.length} activities
              </Text>
            </>
          )}
        </Stack>
      </Card>
    );
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek - 1] || `Day ${dayOfWeek}`;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      {children({ draggedItem, isDragging })}
      
      <DragOverlay>
        {renderDragOverlay()}
      </DragOverlay>
    </DndContext>
  );
}