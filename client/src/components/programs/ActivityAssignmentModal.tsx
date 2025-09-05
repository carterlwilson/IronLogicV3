'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  TextInput,
  Select,
  MultiSelect,
  Button,
  Card,
  Badge,
  Pagination,
  Center,
  Loader,
  Alert,
  Collapse,
  NumberInput,
  Textarea,
  Divider,
  Stepper,
  ActionIcon,
  ScrollArea
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconBarbell,
  IconRun,
  IconClipboardCheck,
  IconArrowLeft,
  IconCheck,
  IconX,
  IconInfoCircle
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { useActivities } from '../../hooks/useActivities';
import { useActivityGroups } from '../../hooks/useActivityGroups';
import type { ActivityTemplate } from '../../types/activities';
import type { ProgramDay, ProgramActivity } from '../../types/index';

interface ActivityAssignmentModalProps {
  opened: boolean;
  onClose: () => void;
  programDay: ProgramDay;
  onAddActivity: (activity: ProgramActivity) => void;
  gymId: string;
}

interface ActivityConfigForm {
  templateId: string;
  sets?: number;
  reps?: number;
  restPeriod?: number;
  intensityPercentage?: number;
  duration?: number; // for conditioning in seconds
  distance?: number; // for conditioning in meters
  notes?: string;
  type: 'strength' | 'conditioning' | 'diagnostic';
}

export function ActivityAssignmentModal({
  opened,
  onClose,
  programDay,
  onAddActivity,
  gymId
}: ActivityAssignmentModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<ActivityTemplate | null>(null);
  const [configForm, setConfigForm] = useState<ActivityConfigForm>({
    templateId: '',
    restPeriod: 60, // default 60 seconds
    type: 'strength'
  });

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activityGroupFilter, setActivityGroupFilter] = useState<string[]>([]);
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

  // API hooks
  const {
    activities,
    loading: activitiesLoading,
    fetchActivities
  } = useActivities();

  const {
    activityGroups,
    loading: groupsLoading,
    fetchActivityGroups
  } = useActivityGroups();

  // Load data when modal opens
  useEffect(() => {
    if (opened) {
      fetchActivities({ page: 1, limit: 20 });
      fetchActivityGroups();
      // Reset state
      setCurrentStep(0);
      setSelectedActivity(null);
      setSearchTerm('');
      setTypeFilter('');
      setActivityGroupFilter([]);
      setTagsFilter([]);
      setCurrentPage(1);
    }
  }, [opened]);

  // Search activities when filters change
  useEffect(() => {
    if (opened) {
      const filters: any = { page: currentPage, limit: 20 };
      if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
      if (typeFilter) filters.type = typeFilter;
      if (activityGroupFilter.length > 0) filters.activityGroups = activityGroupFilter;
      if (tagsFilter.length > 0) filters.tags = tagsFilter;
      
      fetchActivities(filters);
    }
  }, [opened, debouncedSearchTerm, typeFilter, activityGroupFilter, tagsFilter, currentPage]);

  // Filter options
  const typeOptions = [
    { value: 'strength', label: 'Strength' },
    { value: 'conditioning', label: 'Conditioning' },
    { value: 'diagnostic', label: 'Diagnostic' }
  ];

  const activityGroupOptions = useMemo(() => {
    return (activityGroups || []).map(group => ({
      value: group.name,
      label: `${group.name} (${group.count})`
    }));
  }, [activityGroups]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    (activities || []).forEach(activity => {
      (activity.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).map(tag => ({ value: tag, label: tag }));
  }, [activities]);

  // Helper to map activity template type to program activity type
  const mapActivityType = (templateType: string): 'strength' | 'conditioning' | 'diagnostic' => {
    switch (templateType) {
      case 'primary lift':
      case 'accessory lift':
        return 'strength';
      case 'conditioning':
        return 'conditioning';
      case 'diagnostic':
        return 'diagnostic';
      default:
        return 'strength';
    }
  };

  // Handle activity selection
  const selectActivity = (activity: ActivityTemplate) => {
    setSelectedActivity(activity);
    setConfigForm({
      templateId: activity._id,
      restPeriod: 60,
      type: mapActivityType(activity.type)
    });
    setCurrentStep(1);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!selectedActivity) return;

    const newActivity: ProgramActivity = {
      activityId: `activity-${Date.now()}` as any, // Will be replaced by server
      templateId: selectedActivity._id as any,
      templateName: selectedActivity.name, // Include the activity name
      orderIndex: (programDay.activities?.length || 0),
      type: configForm.type,
      sets: configForm.sets,
      reps: configForm.reps,
      restPeriod: configForm.restPeriod,
      intensityPercentage: configForm.intensityPercentage,
      duration: configForm.duration,
      distance: configForm.distance,
      notes: configForm.notes
    };

    onAddActivity(newActivity);
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(0);
    setSelectedActivity(null);
    setConfigForm({
      templateId: '',
      restPeriod: 60,
      type: 'strength'
    });
    onClose();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'primary lift':
      case 'accessory lift':
      case 'strength':
        return <IconBarbell size="1rem" />;
      case 'conditioning':
        return <IconRun size="1rem" />;
      case 'diagnostic':
        return <IconClipboardCheck size="1rem" />;
      default:
        return <IconBarbell size="1rem" />;
    }
  };

  const isConfigValid = () => {
    if (!selectedActivity) return false;
    
    if (configForm.type === 'strength') {
      return configForm.sets && configForm.reps && configForm.sets > 0 && configForm.reps > 0;
    }
    
    if (configForm.type === 'conditioning') {
      return true; // No required fields for conditioning activities
    }
    
    return true; // diagnostic doesn't require specific config
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconPlus size="1.2rem" />
          <Text fw={600}>Add Activity to {programDay.name || `Day ${programDay.dayOfWeek}`}</Text>
        </Group>
      }
      size="xl"
      centered
    >
      <Stepper active={currentStep} onStepClick={setCurrentStep} allowNextStepsSelect={false}>
        <Stepper.Step label="Select Activity" description="Find and choose an activity">
          <Stack gap="md">
            {/* Search and Filters */}
            <Card withBorder p="md">
              <Stack gap="md">
                <TextInput
                  placeholder="Search activities..."
                  leftSection={<IconSearch size="1rem" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                />
                
                <Group gap="md">
                  <Select
                    placeholder="Type"
                    data={typeOptions}
                    value={typeFilter}
                    onChange={setTypeFilter}
                    clearable
                    w={120}
                  />
                  
                  <MultiSelect
                    placeholder="Activity Groups"
                    data={activityGroupOptions}
                    value={activityGroupFilter}
                    onChange={setActivityGroupFilter}
                    searchable
                    w={200}
                  />
                  
                  <MultiSelect
                    placeholder="Tags"
                    data={allTags}
                    value={tagsFilter}
                    onChange={setTagsFilter}
                    searchable
                    w={150}
                  />
                </Group>
                
                {(searchTerm || typeFilter || activityGroupFilter.length > 0 || tagsFilter.length > 0) && (
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">Active filters:</Text>
                    {searchTerm && <Badge variant="light">Search: {searchTerm}</Badge>}
                    {typeFilter && <Badge variant="light">Type: {typeFilter}</Badge>}
                    {activityGroupFilter.map(group => (
                      <Badge key={group} variant="light">Group: {group}</Badge>
                    ))}
                    {tagsFilter.map(tag => (
                      <Badge key={tag} variant="light">Tag: {tag}</Badge>
                    ))}
                  </Group>
                )}
              </Stack>
            </Card>

            {/* Activities List */}
            <ScrollArea h={400}>
              {activitiesLoading ? (
                <Center h={200}>
                  <Loader />
                </Center>
              ) : (
                <Stack gap="md">
                  {(activities || []).map((activity) => (
                    <Card
                      key={activity._id}
                      withBorder
                      p="md"
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => selectActivity(activity)}
                      bg={selectedActivity?._id === activity._id ? 'blue.0' : undefined}
                    >
                      <Group justify="space-between" align="flex-start">
                        <Group gap="md" align="flex-start" style={{ flex: 1 }}>
                          {getActivityIcon(activity.type)}
                          <div style={{ flex: 1 }}>
                            <Group gap="xs" mb="xs">
                              <Text fw={500}>{activity.name}</Text>
                              <Badge size="xs" color="blue" variant="light">
                                {activity.type}
                              </Badge>
                              <Badge size="xs" color="gray" variant="outline">
                                {activity.activityGroupName}
                              </Badge>
                            </Group>
                            
                            {activity.description && (
                              <Text size="sm" c="dimmed" lineClamp={2}>
                                {activity.description}
                              </Text>
                            )}
                            
                            {activity.tags && activity.tags.length > 0 && (
                              <Group gap="xs" mt="xs">
                                {activity.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} size="xs" variant="dot">
                                    {tag}
                                  </Badge>
                                ))}
                                {activity.tags.length > 3 && (
                                  <Badge size="xs" variant="light" color="gray">
                                    +{activity.tags.length - 3} more
                                  </Badge>
                                )}
                              </Group>
                            )}
                          </div>
                        </Group>
                        <Button size="xs" variant="light">
                          Select
                        </Button>
                      </Group>
                    </Card>
                  ))}
                  
                  {activities && activities.length === 0 && (
                    <Alert icon={<IconInfoCircle size="1rem" />} title="No activities found">
                      Try adjusting your search criteria or filters to find more activities.
                    </Alert>
                  )}
                </Stack>
              )}
            </ScrollArea>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Configure Activity" description="Set parameters and details">
          {selectedActivity && (
            <Stack gap="md">
              {/* Selected Activity Info */}
              <Card withBorder p="md" bg="blue.0">
                <Group gap="md">
                  {getActivityIcon(selectedActivity.type)}
                  <div>
                    <Text fw={600}>{selectedActivity.name}</Text>
                    <Group gap="xs">
                      <Badge size="sm" color="blue" variant="light">
                        {selectedActivity.type}
                      </Badge>
                      <Badge size="sm" color="gray" variant="outline">
                        {selectedActivity.activityGroupName}
                      </Badge>
                    </Group>
                    {selectedActivity.description && (
                      <Text size="sm" c="dimmed" mt="xs">
                        {selectedActivity.description}
                      </Text>
                    )}
                  </div>
                </Group>
              </Card>

              <Divider label="Activity Configuration" labelPosition="center" />

              {/* Configuration Form */}
              {configForm.type === 'strength' && (
                <Group gap="md">
                  <NumberInput
                    label="Sets"
                    placeholder="Enter number of sets"
                    value={configForm.sets}
                    onChange={(value) => setConfigForm(prev => ({ ...prev, sets: Number(value) || undefined }))}
                    min={1}
                    max={20}
                    required
                    style={{ flex: 1 }}
                  />
                  <NumberInput
                    label="Reps"
                    placeholder="Reps per set"
                    value={configForm.reps}
                    onChange={(value) => setConfigForm(prev => ({ ...prev, reps: Number(value) || undefined }))}
                    min={1}
                    max={100}
                    required
                    style={{ flex: 1 }}
                  />
                  <NumberInput
                    label="Intensity %"
                    placeholder="% of 1RM"
                    value={configForm.intensityPercentage}
                    onChange={(value) => setConfigForm(prev => ({ ...prev, intensityPercentage: Number(value) || undefined }))}
                    min={10}
                    max={200}
                    suffix="%"
                    style={{ flex: 1 }}
                  />
                </Group>
              )}

              {configForm.type === 'conditioning' && (
                <>
                  <Alert icon={<IconInfoCircle size="1rem" />} title="Conditioning Activity">
                    All fields are optional for conditioning activities. Add parameters as needed.
                  </Alert>
                  <Group gap="md">
                    <NumberInput
                      label="Duration (minutes)"
                      placeholder="Optional activity duration"
                      value={configForm.duration ? Math.floor(configForm.duration / 60) : undefined}
                      onChange={(value) => setConfigForm(prev => ({ 
                        ...prev, 
                        duration: value ? Number(value) * 60 : undefined 
                      }))}
                      min={1}
                      max={180}
                      style={{ flex: 1 }}
                    />
                    <NumberInput
                      label="Distance (meters)"
                      placeholder="Optional distance"
                      value={configForm.distance}
                      onChange={(value) => setConfigForm(prev => ({ ...prev, distance: Number(value) || undefined }))}
                      min={1}
                      max={50000}
                      style={{ flex: 1 }}
                    />
                  </Group>
                </>
              )}

              {configForm.type === 'diagnostic' && (
                <Alert icon={<IconInfoCircle size="1rem" />} title="Diagnostic Activity">
                  This activity will be used for assessment purposes. No specific configuration required.
                </Alert>
              )}

              {/* Common Configuration */}
              <Group gap="md">
                <NumberInput
                  label="Rest Period (seconds)"
                  placeholder="Rest between sets"
                  value={configForm.restPeriod}
                  onChange={(value) => setConfigForm(prev => ({ ...prev, restPeriod: Number(value) || 60 }))}
                  min={0}
                  max={600}
                  style={{ flex: 1 }}
                />
              </Group>

              <Textarea
                label="Notes"
                placeholder="Optional notes for this activity..."
                value={configForm.notes}
                onChange={(e) => setConfigForm(prev => ({ ...prev, notes: e.currentTarget.value }))}
                maxRows={3}
              />

              {/* Validation Alert */}
              {!isConfigValid() && (
                <Alert icon={<IconX size="1rem" />} title="Missing Required Fields" color="red">
                  {configForm.type === 'strength' && 'Please enter both sets and reps.'}
                </Alert>
              )}
            </Stack>
          )}
        </Stepper.Step>
      </Stepper>

      {/* Modal Actions */}
      <Group justify="space-between" mt="xl">
        <Group gap="xs">
          {currentStep > 0 && (
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size="1rem" />}
              onClick={() => setCurrentStep(0)}
            >
              Back
            </Button>
          )}
        </Group>

        <Group gap="xs">
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          {currentStep === 1 && (
            <Button
              leftSection={<IconCheck size="1rem" />}
              onClick={handleSubmit}
              disabled={!isConfigValid()}
            >
              Add Activity
            </Button>
          )}
        </Group>
      </Group>
    </Modal>
  );
}