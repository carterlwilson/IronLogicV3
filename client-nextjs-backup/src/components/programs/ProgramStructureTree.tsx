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
  IconGripVertical
} from '@tabler/icons-react';
import { WorkoutProgram, ProgramBlock, ProgramWeek, ProgramDay } from '../../../../shared/src/types';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  dragProps?: DragDropContextProps;
}

export function ProgramStructureTree({
  program,
  onUpdateBlock,
  onRemoveBlock,
  onAddWeek,
  onRemoveWeek,
  onAddDay,
  onRemoveDay
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
                {day.activities.length} activities
              </Text>
            </div>
          </Group>
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