'use client';

import { useState } from 'react';
import {
  Stack,
  Group,
  Text,
  Button,
  ActionIcon,
  Card,
  Badge,
  Collapse,
  Menu,
  TextInput
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronRight,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconClock,
  IconGripVertical,
  IconBarbell,
  IconRun,
  IconClipboardCheck
} from '@tabler/icons-react';
import type { WorkoutProgram, ProgramBlock, ProgramWeek, ProgramDay, ProgramActivity } from '../../types/index';
import { useSortable, SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

interface DragDropContextProps {
  draggedItem: any;
  isDragging: boolean;
}

interface ProgramStructureTreeProps {
  program: WorkoutProgram;
  onUpdateBlock: (blockIndex: number, updates: Partial<ProgramBlock>) => void;
  onRemoveBlock: (blockIndex: number) => void;
  onAddWeek: (blockIndex: number) => void;
  onRemoveWeek: (blockIndex: number, weekIndex: number) => void;
  onAddDay: (blockIndex: number, weekIndex: number, dayOfWeek: number) => void;
  onRemoveDay: (blockIndex: number, weekIndex: number, dayIndex: number) => void;
  onAddActivity: (blockIndex: number, weekIndex: number, dayIndex: number) => void;
  onRemoveActivity: (blockIndex: number, weekIndex: number, dayIndex: number, activityIndex: number) => void;
  onReorderActivities: (blockIndex: number, weekIndex: number, dayIndex: number, oldIndex: number, newIndex: number) => void;
  dragProps?: DragDropContextProps;
}

export function ProgramStructureTree({
  program,
  onUpdateBlock,
  onRemoveBlock,
  onAddWeek,
  onRemoveWeek,
  onAddDay,
  onRemoveDay,
  onAddActivity,
  onRemoveActivity,
  onReorderActivities
}: ProgramStructureTreeProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [blockEditName, setBlockEditName] = useState('');

  const toggleBlock = (blockId: string) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId);
    } else {
      newExpanded.add(blockId);
    }
    setExpandedBlocks(newExpanded);
  };

  const toggleWeek = (weekId: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekId)) {
      newExpanded.delete(weekId);
    } else {
      newExpanded.add(weekId);
    }
    setExpandedWeeks(newExpanded);
  };

  const startEditingBlock = (blockIndex: number, currentName: string) => {
    setEditingBlock(`${blockIndex}`);
    setBlockEditName(currentName);
  };

  const saveBlockName = (blockIndex: number) => {
    if (blockEditName.trim()) {
      onUpdateBlock(blockIndex, { name: blockEditName.trim() });
    }
    setEditingBlock(null);
    setBlockEditName('');
  };

  const cancelEditingBlock = () => {
    setEditingBlock(null);
    setBlockEditName('');
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek - 1] || `Day ${dayOfWeek}`;
  };

  const getAvailableDays = (week: ProgramWeek): Array<{ value: string; label: string }> => {
    const usedDays = new Set(week.days.map(day => day.dayOfWeek));
    const allDays = [
      { value: '1', label: 'Monday' },
      { value: '2', label: 'Tuesday' },
      { value: '3', label: 'Wednesday' },
      { value: '4', label: 'Thursday' },
      { value: '5', label: 'Friday' },
      { value: '6', label: 'Saturday' },
      { value: '7', label: 'Sunday' }
    ];
    return allDays.filter(day => !usedDays.has(parseInt(day.value)));
  };

  // Sortable Block Component
  function SortableBlock({ 
    block, 
    blockIndex, 
    isExpanded, 
    isEditing,
    children 
  }: { 
    block: ProgramBlock; 
    blockIndex: number; 
    isExpanded: boolean;
    isEditing: boolean;
    children: React.ReactNode;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: `block-${block.blockId.toString()}`,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <Card ref={setNodeRef} style={style} withBorder p="md">
        <Stack gap="sm">
          {/* Block Header */}
          <Group justify="space-between">
            <Group gap="xs">
              <ActionIcon
                {...attributes}
                {...listeners}
                variant="subtle"
                size="sm"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <IconGripVertical size="1rem" />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => toggleBlock(block.blockId.toString())}
              >
                {isExpanded ? 
                  <IconChevronDown size="1rem" /> : 
                  <IconChevronRight size="1rem" />
                }
              </ActionIcon>
              
              {isEditing ? (
                <Group gap="xs">
                  <TextInput
                    size="sm"
                    value={blockEditName}
                    onChange={(event) => setBlockEditName(event.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') saveBlockName(blockIndex);
                      if (event.key === 'Escape') cancelEditingBlock();
                    }}
                    autoFocus
                  />
                  <Button
                    size="xs"
                    onClick={() => saveBlockName(blockIndex)}
                    disabled={!blockEditName.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={cancelEditingBlock}
                  >
                    Cancel
                  </Button>
                </Group>
              ) : (
                <div>
                  <Text fw={600}>Block {blockIndex + 1}: {block.name}</Text>
                  <Group gap="xs">
                    <Badge size="xs" color="blue" variant="light">
                      {block.weeks.length} weeks
                    </Badge>
                    <Badge size="xs" color="gray" variant="light">
                      {block.weeks.reduce((total, week) => total + week.days.length, 0)} days
                    </Badge>
                  </Group>
                </div>
              )}
            </Group>

            {!isEditing && (
              <Group gap="xs">
                <Button
                  size="xs"
                  leftSection={<IconPlus size="0.8rem" />}
                  onClick={() => onAddWeek(blockIndex)}
                >
                  Add Week
                </Button>
                <Menu shadow="md" width={150}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" size="sm">
                      <IconDots size="1rem" />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconEdit size="0.9rem" />}
                      onClick={() => startEditingBlock(blockIndex, block.name)}
                    >
                      Rename
                    </Menu.Item>
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash size="0.9rem" />}
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this block?')) {
                          onRemoveBlock(blockIndex);
                        }
                      }}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            )}
          </Group>

          {/* Block Description */}
          {block.description && (
            <Text size="sm" c="dimmed" ml={24}>
              {block.description}
            </Text>
          )}

          {children}
        </Stack>
      </Card>
    );
  }

  // Sortable Week Component
  function SortableWeek({ 
    week, 
    blockIndex,
    weekIndex, 
    isExpanded,
    children 
  }: { 
    week: ProgramWeek; 
    blockIndex: number;
    weekIndex: number; 
    isExpanded: boolean;
    children: React.ReactNode;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: `week-${week.weekId.toString()}`,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const availableDays = getAvailableDays(week);

    return (
      <Card ref={setNodeRef} style={style} withBorder p="sm" bg="gray.0">
        <Stack gap="xs">
          {/* Week Header */}
          <Group justify="space-between">
            <Group gap="xs">
              <ActionIcon
                {...attributes}
                {...listeners}
                variant="subtle"
                size="xs"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <IconGripVertical size="0.8rem" />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="xs"
                onClick={() => toggleWeek(week.weekId.toString())}
              >
                {isExpanded ? 
                  <IconChevronDown size="0.8rem" /> : 
                  <IconChevronRight size="0.8rem" />
                }
              </ActionIcon>
              <IconCalendar size="1rem" />
              <div>
                <Text size="sm" fw={500}>
                  Week {week.weekNumber}
                </Text>
                <Badge size="xs" color="green" variant="light">
                  {week.days.length} days
                </Badge>
              </div>
            </Group>

            <Group gap="xs">
              {availableDays.length > 0 && (
                <Menu shadow="md" width={150}>
                  <Menu.Target>
                    <Button size="xs" leftSection={<IconPlus size="0.7rem" />}>
                      Add Day
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {availableDays.map(day => (
                      <Menu.Item
                        key={day.value}
                        onClick={() => onAddDay(blockIndex, weekIndex, parseInt(day.value))}
                      >
                        {day.label}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
              )}
              <ActionIcon
                variant="subtle"
                size="xs"
                color="red"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this week?')) {
                    onRemoveWeek(blockIndex, weekIndex);
                  }
                }}
              >
                <IconTrash size="0.8rem" />
              </ActionIcon>
            </Group>
          </Group>

          {children}
        </Stack>
      </Card>
    );
  }

  // Helper function to get activity type icon
  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <IconBarbell size="0.7rem" />;
      case 'conditioning':
        return <IconRun size="0.7rem" />;
      case 'diagnostic':
        return <IconClipboardCheck size="0.7rem" />;
      default:
        return <IconBarbell size="0.7rem" />;
    }
  };

  // Sortable Activity Component
  function SortableActivity({
    activity,
    activityIndex,
    blockIndex,
    weekIndex,
    dayIndex
  }: {
    activity: ProgramActivity;
    activityIndex: number;
    blockIndex: number;
    weekIndex: number;
    dayIndex: number;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: `activity-${activity.activityId}`,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <Card ref={setNodeRef} style={style} withBorder p="xs" bg="gray.0">
        <Group justify="space-between" align="flex-start">
          <Group gap="xs" align="flex-start">
            <ActionIcon
              {...attributes}
              {...listeners}
              variant="subtle"
              size="xs"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <IconGripVertical size="0.6rem" />
            </ActionIcon>
            {getActivityTypeIcon(activity.type)}
            <div style={{ flex: 1 }}>
              <Text size="xs" fw={500}>
                {activity.templateName}
              </Text>
              <Group gap="xs" mt="xs">
                {activity.sets && activity.reps && (
                  <Badge size="xs" variant="light" color="blue">
                    {activity.sets}×{activity.reps}
                  </Badge>
                )}
                {activity.intensityPercentage && (
                  <Badge size="xs" variant="light" color="green">
                    {activity.intensityPercentage}%
                  </Badge>
                )}
                {activity.duration && (
                  <Badge size="xs" variant="light" color="orange">
                    {Math.floor(activity.duration / 60)}:{(activity.duration % 60).toString().padStart(2, '0')}
                  </Badge>
                )}
                {activity.restPeriod && (
                  <Badge size="xs" variant="light" color="gray">
                    Rest: {activity.restPeriod}s
                  </Badge>
                )}
              </Group>
              {activity.notes && (
                <Text size="xs" c="dimmed" mt="xs">
                  {activity.notes}
                </Text>
              )}
            </div>
          </Group>
          <ActionIcon
            variant="subtle"
            size="xs"
            color="red"
            onClick={() => {
              if (window.confirm('Are you sure you want to remove this activity?')) {
                onRemoveActivity(blockIndex, weekIndex, dayIndex, activityIndex);
              }
            }}
          >
            <IconTrash size="0.6rem" />
          </ActionIcon>
        </Group>
      </Card>
    );
  }

  // Sortable Day Component
  function SortableDay({ 
    day, 
    blockIndex,
    weekIndex,
    dayIndex 
  }: { 
    day: ProgramDay; 
    blockIndex: number;
    weekIndex: number;
    dayIndex: number;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: `day-${day.dayId.toString()}`,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <Card ref={setNodeRef} style={style} withBorder p="xs" bg="white">
        <Stack gap="xs">
          {/* Day Header */}
          <Group justify="space-between">
            <Group gap="xs">
              <ActionIcon
                {...attributes}
                {...listeners}
                variant="subtle"
                size="xs"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <IconGripVertical size="0.7rem" />
              </ActionIcon>
              <IconClock size="0.8rem" />
              <div>
                <Text size="xs" fw={500}>
                  {getDayName(day.dayOfWeek)}
                </Text>
                <Text size="xs" c="dimmed">
                  {day.activities?.length || 0} activities
                </Text>
              </div>
            </Group>
            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size="0.6rem" />}
                onClick={() => onAddActivity(blockIndex, weekIndex, dayIndex)}
              >
                Add Activity
              </Button>
              <ActionIcon
                variant="subtle"
                size="xs"
                color="red"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this day?')) {
                    onRemoveDay(blockIndex, weekIndex, dayIndex);
                  }
                }}
              >
                <IconTrash size="0.7rem" />
              </ActionIcon>
            </Group>
          </Group>

          {/* Activities List with Drag and Drop */}
          {day.activities && day.activities.length > 0 && (
            <div style={{ marginLeft: 16 }}>
              <DndContext
                sensors={useSensors(
                  useSensor(PointerSensor),
                  useSensor(KeyboardSensor, {
                    coordinateGetter: sortableKeyboardCoordinates,
                  })
                )}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event;
                  
                  if (active.id !== over?.id) {
                    const oldIndex = day.activities.findIndex(activity => `activity-${activity.activityId}` === active.id);
                    const newIndex = day.activities.findIndex(activity => `activity-${activity.activityId}` === over?.id);
                    
                    if (oldIndex !== -1 && newIndex !== -1) {
                      onReorderActivities(blockIndex, weekIndex, dayIndex, oldIndex, newIndex);
                    }
                  }
                }}
              >
                <SortableContext
                  items={day.activities.map(activity => `activity-${activity.activityId}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <Stack gap="xs">
                    {day.activities.map((activity, activityIndex) => (
                      <SortableActivity
                        key={activity.activityId}
                        activity={activity}
                        activityIndex={activityIndex}
                        blockIndex={blockIndex}
                        weekIndex={weekIndex}
                        dayIndex={dayIndex}
                      />
                    ))}
                  </Stack>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Empty state for no activities */}
          {(!day.activities || day.activities.length === 0) && (
            <Text size="xs" c="dimmed" ta="center" p="md">
              No activities added yet. Click "Add Activity" to get started.
            </Text>
          )}
        </Stack>
      </Card>
    );
  }

  return (
    <SortableContext 
      items={program.blocks.map(block => `block-${block.blockId.toString()}`)}
      strategy={verticalListSortingStrategy}
    >
      <Stack gap="md">
        {program.blocks.map((block, blockIndex) => {
          const isBlockExpanded = expandedBlocks.has(block.blockId.toString());
          const isEditing = editingBlock === `${blockIndex}`;

          return (
            <SortableBlock
              key={block.blockId.toString()}
              block={block}
              blockIndex={blockIndex}
              isExpanded={isBlockExpanded}
              isEditing={isEditing}
            >
              {/* Weeks */}
              <Collapse in={isBlockExpanded}>
                <Stack gap="sm" ml={24}>
                  {block.weeks.length === 0 ? (
                    <Text c="dimmed" size="sm">
                      No weeks in this block yet
                    </Text>
                  ) : (
                    <SortableContext
                      items={block.weeks.map(week => `week-${week.weekId.toString()}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {block.weeks.map((week, weekIndex) => {
                        const isWeekExpanded = expandedWeeks.has(week.weekId.toString());

                        return (
                          <SortableWeek
                            key={week.weekId.toString()}
                            week={week}
                            blockIndex={blockIndex}
                            weekIndex={weekIndex}
                            isExpanded={isWeekExpanded}
                          >
                            {/* Days */}
                            <Collapse in={isWeekExpanded}>
                              <Stack gap="xs" ml={16}>
                                {week.days.length === 0 ? (
                                  <Text c="dimmed" size="xs">
                                    No days scheduled for this week
                                  </Text>
                                ) : (
                                  <SortableContext
                                    items={week.days.map(day => `day-${day.dayId.toString()}`)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    {week.days.map((day, dayIndex) => (
                                      <SortableDay
                                        key={day.dayId.toString()}
                                        day={day}
                                        blockIndex={blockIndex}
                                        weekIndex={weekIndex}
                                        dayIndex={dayIndex}
                                      />
                                    ))}
                                  </SortableContext>
                                )}
                              </Stack>
                            </Collapse>
                          </SortableWeek>
                        );
                      })}
                    </SortableContext>
                  )}
                </Stack>
              </Collapse>
            </SortableBlock>
          );
        })}
      </Stack>
    </SortableContext>
  );
}