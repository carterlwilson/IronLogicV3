'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Grid,
  Stack,
  Title,
  Button,
  Group,
  Text,
  Card,
  Divider,
  ActionIcon,
  Badge,
  Loader,
  Center,
  Modal
} from '@mantine/core';
import {
  IconDeviceFloppy,
  IconX,
  IconPlus,
  IconSettings,
  IconEye,
  IconChevronLeft
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import type { WorkoutProgram, ProgramBlock, ProgramWeek, ProgramDay } from '../../types/index';
import { useWorkoutPrograms } from '../../hooks/useWorkoutPrograms';
import { ProgramMetadataForm } from './ProgramMetadataForm';
import { ProgramStructureTree } from './ProgramStructureTree';
import { DragDropProgramBuilder } from './DragDropProgramBuilder';
import Link from 'react-router-dom';

interface ProgramBuilderProps {}

export function ProgramBuilder({}: ProgramBuilderProps) {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const programId = searchParams.get('id');
  
  const { getProgram, createProgram, updateProgram } = useWorkoutPrograms();
  
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);

  // Load existing program if ID is provided
  useEffect(() => {
    if (programId) {
      loadProgram(programId);
    } else {
      // Create new empty program
      setProgram(createEmptyProgram());
    }
  }, [programId]);

  const loadProgram = async (id: string) => {
    setLoading(true);
    try {
      const loadedProgram = await getProgram(id);
      if (loadedProgram) {
        setProgram(loadedProgram);
      } else {
        notifications.show({
          title: 'Error',
          message: 'Program not found',
          color: 'red',
        });
        navigate('/programs');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load program',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const createEmptyProgram = (): WorkoutProgram => {
    return {
      _id: 'new',
      name: 'New Program',
      gymId: '',
      description: '',
      blocks: [],
      durationWeeks: 0,
      isActive: true,
      isTemplate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };
  };

  const createEmptyBlock = (): ProgramBlock => {
    return {
      blockId: `block-${Date.now()}`,
      name: 'New Block',
      description: '',
      orderIndex: program?.blocks.length || 0,
      volumeTargets: [],
      weeks: []
    };
  };

  const createEmptyWeek = (blockIndex: number): ProgramWeek => {
    const block = program?.blocks[blockIndex];
    return {
      weekId: `week-${Date.now()}`,
      weekNumber: (block?.weeks.length || 0) + 1,
      description: '',
      volumeTargets: [],
      days: []
    };
  };

  const createEmptyDay = (dayOfWeek: number): ProgramDay => {
    return {
      dayId: `day-${Date.now()}`,
      dayOfWeek,
      name: getDayName(dayOfWeek),
      activities: []
    };
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek - 1] || `Day ${dayOfWeek}`;
  };

  const updateProgramMetadata = useCallback((updates: Partial<WorkoutProgram>) => {
    if (!program) return;
    
    setProgram(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : prev);
    setHasChanges(true);
  }, [program]);

  const addBlock = useCallback(() => {
    if (!program) return;
    
    const newBlock = createEmptyBlock();
    setProgram(prev => prev ? {
      ...prev,
      blocks: [...prev.blocks, newBlock],
      updatedAt: new Date()
    } : prev);
    setHasChanges(true);
  }, [program]);

  const removeBlock = useCallback((blockIndex: number) => {
    if (!program) return;
    
    setProgram(prev => prev ? {
      ...prev,
      blocks: prev.blocks.filter((_, index) => index !== blockIndex),
      updatedAt: new Date()
    } : prev);
    setHasChanges(true);
  }, [program]);

  const updateBlock = useCallback((blockIndex: number, updates: Partial<ProgramBlock>) => {
    if (!program) return;
    
    setProgram(prev => prev ? {
      ...prev,
      blocks: prev.blocks.map((block, index) => 
        index === blockIndex ? { ...block, ...updates } : block
      ),
      updatedAt: new Date()
    } : prev);
    setHasChanges(true);
  }, [program]);

  const addWeek = useCallback((blockIndex: number) => {
    if (!program) return;
    
    const newWeek = createEmptyWeek(blockIndex);
    setProgram(prev => prev ? {
      ...prev,
      blocks: prev.blocks.map((block, index) => 
        index === blockIndex ? {
          ...block,
          weeks: [...block.weeks, newWeek]
        } : block
      ),
      updatedAt: new Date()
    } : prev);
    setHasChanges(true);
  }, [program]);

  const removeWeek = useCallback((blockIndex: number, weekIndex: number) => {
    if (!program) return;
    
    setProgram(prev => prev ? {
      ...prev,
      blocks: prev.blocks.map((block, bIndex) => 
        bIndex === blockIndex ? {
          ...block,
          weeks: block.weeks.filter((_, wIndex) => wIndex !== weekIndex)
        } : block
      ),
      updatedAt: new Date()
    } : prev);
    setHasChanges(true);
  }, [program]);

  const addDay = useCallback((blockIndex: number, weekIndex: number, dayOfWeek: number) => {
    if (!program) return;
    
    const newDay = createEmptyDay(dayOfWeek);
    setProgram(prev => prev ? {
      ...prev,
      blocks: prev.blocks.map((block, bIndex) => 
        bIndex === blockIndex ? {
          ...block,
          weeks: block.weeks.map((week, wIndex) => 
            wIndex === weekIndex ? {
              ...week,
              days: [...week.days, newDay].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            } : week
          )
        } : block
      ),
      updatedAt: new Date()
    } : prev);
    setHasChanges(true);
  }, [program]);

  const removeDay = useCallback((blockIndex: number, weekIndex: number, dayIndex: number) => {
    if (!program) return;
    
    setProgram(prev => prev ? {
      ...prev,
      blocks: prev.blocks.map((block, bIndex) => 
        bIndex === blockIndex ? {
          ...block,
          weeks: block.weeks.map((week, wIndex) => 
            wIndex === weekIndex ? {
              ...week,
              days: week.days.filter((_, dIndex) => dIndex !== dayIndex)
            } : week
          )
        } : block
      ),
      updatedAt: new Date()
    } : prev);
    setHasChanges(true);
  }, [program]);

  const calculateDurationWeeks = useCallback(() => {
    if (!program) return 0;
    return program.blocks.reduce((total, block) => total + block.weeks.length, 0);
  }, [program]);

  const handleSave = async () => {
    if (!program) return;

    setSaving(true);
    try {
      const programData = {
        ...program,
        durationWeeks: calculateDurationWeeks()
      };

      let success = false;
      if (program._id.toString() === 'new') {
        success = await createProgram(programData);
      } else {
        success = await updateProgram(program._id.toString(), programData);
      }

      if (success) {
        setHasChanges(false);
        notifications.show({
          title: 'Success',
          message: 'Program saved successfully',
          color: 'green',
        });
        
        if (program._id.toString() === 'new') {
          navigate('/programs');
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save program',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmed) return;
    }
    navigate('/programs');
  };

  const handleProgramUpdate = useCallback((updatedProgram: WorkoutProgram) => {
    setProgram(updatedProgram);
    setHasChanges(true);
  }, []);

  if (loading) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading program...</Text>
        </Stack>
      </Center>
    );
  }

  if (!program) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Text size="lg">Program not found</Text>
          <Button component={Link} href="/programs">
            Back to Programs
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Group>
          <ActionIcon 
            variant="subtle" 
            size="lg"
            component={Link}
            href="/programs"
          >
            <IconChevronLeft size="1.2rem" />
          </ActionIcon>
          <div>
            <Title order={2}>
              {program._id.toString() === 'new' ? 'Create Program' : 'Edit Program'}
            </Title>
            <Group gap="xs">
              <Text c="dimmed" size="sm">
                {program.name}
              </Text>
              {hasChanges && (
                <Badge size="xs" color="orange" variant="dot">
                  Unsaved changes
                </Badge>
              )}
            </Group>
          </div>
        </Group>

        <Group>
          <Button
            variant="subtle"
            leftSection={<IconEye size="1rem" />}
            onClick={openPreview}
          >
            Preview
          </Button>
          <Button
            variant="default"
            onClick={handleDiscard}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size="1rem" />}
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
          >
            Save Program
          </Button>
        </Group>
      </Group>

      {/* Main Content */}
      <Grid gutter="lg">
        {/* Left Panel - Program Properties */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            <Card withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={4}>Program Details</Title>
                  <ActionIcon variant="subtle" size="sm">
                    <IconSettings size="1rem" />
                  </ActionIcon>
                </Group>
                <Divider />
                <ProgramMetadataForm
                  program={program}
                  onUpdate={updateProgramMetadata}
                />
              </Stack>
            </Card>

            {/* Program Statistics */}
            <Card withBorder>
              <Stack gap="md">
                <Title order={4}>Statistics</Title>
                <Divider />
                <Group gap="md">
                  <div>
                    <Text size="xs" c="dimmed">Duration</Text>
                    <Text size="lg" fw={600}>
                      {calculateDurationWeeks()} weeks
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Blocks</Text>
                    <Text size="lg" fw={600}>
                      {program.blocks.length}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Total Days</Text>
                    <Text size="lg" fw={600}>
                      {program.blocks.reduce((total, block) => {
                        return total + block.weeks.reduce((weekTotal, week) => {
                          return weekTotal + week.days.length;
                        }, 0);
                      }, 0)}
                    </Text>
                  </div>
                </Group>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>

        {/* Right Panel - Program Structure */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder h="100%">
            <Stack gap="md" h="100%">
              <Group justify="space-between">
                <Title order={4}>Program Structure</Title>
                <Button
                  size="sm"
                  leftSection={<IconPlus size="1rem" />}
                  onClick={addBlock}
                >
                  Add Block
                </Button>
              </Group>
              <Divider />
              
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {program.blocks.length === 0 ? (
                  <Center h={200}>
                    <Stack align="center" gap="md">
                      <Text c="dimmed">No blocks yet</Text>
                      <Button
                        leftSection={<IconPlus size="1rem" />}
                        onClick={addBlock}
                      >
                        Add First Block
                      </Button>
                    </Stack>
                  </Center>
                ) : (
                  <DragDropProgramBuilder
                    program={program}
                    onUpdateProgram={handleProgramUpdate}
                  >
                    {(dragProps) => (
                      <ProgramStructureTree
                        program={program}
                        onUpdateBlock={updateBlock}
                        onRemoveBlock={removeBlock}
                        onAddWeek={addWeek}
                        onRemoveWeek={removeWeek}
                        onAddDay={addDay}
                        onRemoveDay={removeDay}
                        dragProps={dragProps}
                      />
                    )}
                  </DragDropProgramBuilder>
                )}
              </div>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Preview Modal */}
      <Modal
        opened={previewOpened}
        onClose={closePreview}
        title="Program Preview"
        size="xl"
      >
        <Stack gap="md">
          <Text size="lg" fw={600}>{program.name}</Text>
          <Text c="dimmed">{program.description}</Text>
          
          <Group gap="md">
            <Badge color={program.isTemplate ? 'blue' : 'green'}>
              {program.isTemplate ? 'Template' : 'Program'}
            </Badge>
            <Badge color="gray">
              {calculateDurationWeeks()} weeks
            </Badge>
            <Badge color="gray">
              {program.blocks.length} blocks
            </Badge>
          </Group>

          <div>
            <Text fw={500} mb="md">Structure Overview:</Text>
            {program.blocks.map((block, blockIndex) => (
              <div key={block.blockId.toString()} style={{ marginBottom: '1rem' }}>
                <Text fw={500}>Block {blockIndex + 1}: {block.name}</Text>
                <Text size="sm" c="dimmed" ml="md">
                  {block.weeks.length} weeks, {' '}
                  {block.weeks.reduce((total, week) => total + week.days.length, 0)} total days
                </Text>
              </div>
            ))}
          </div>
        </Stack>
      </Modal>
    </Stack>
  );
}