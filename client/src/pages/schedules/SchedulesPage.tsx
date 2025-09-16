import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  Group,
  Title,
  Text,
  Tabs,
  Card,
  Button,
  Select,
  ActionIcon
} from '@mantine/core';
import {
  IconPlus,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconTemplate
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { AppLayout } from '../../components/layout/AppLayout';
import { WeeklyScheduleGrid } from '../../components/schedules/WeeklyScheduleGrid';
import { ScheduleTemplateModal } from '../../components/schedules/ScheduleTemplateModal';
import { CreateWeeklyScheduleModal } from '../../components/schedules/CreateWeeklyScheduleModal';
import { TimeslotModal } from '../../components/schedules/TimeslotModal';
import { TimeslotEnrollmentModal } from '../../components/schedules/TimeslotEnrollmentModal';
import { ScheduleStatsDashboard } from '../../components/schedules/ScheduleStatsDashboard';
import { useScheduleTemplates } from '../../hooks/useScheduleTemplates';
import { useWeeklySchedules } from '../../hooks/useWeeklySchedules';
import type { ScheduleTemplate, WeeklySchedule, TemplateTimeslot, WeeklyTimeslot } from '../../types/schedules';
import { useAuth } from '../../lib/auth-context';

export function SchedulesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'templates');
  const { user } = useAuth();
  
  // Schedule Templates state
  const {
    scheduleTemplates,
    loading: templatesLoading,
    error: templatesError,
    fetchScheduleTemplates,
    createScheduleTemplate,
    updateScheduleTemplate,
    deleteScheduleTemplate,
    setAsDefault
  } = useScheduleTemplates();

  // Weekly Schedules state
  const {
    weeklySchedules,
    loading: schedulesLoading,
    error: schedulesError,
    fetchWeeklySchedules,
    createWeeklySchedule,
    updateWeeklySchedule,
    deleteWeeklySchedule,
    enrollClient,
    cancelEnrollment
  } = useWeeklySchedules();

  // UI state
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null);
  const [selectedWeeklySchedule, setSelectedWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [currentWeek, setCurrentWeek] = useState(getMonday(new Date()));
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null);
  
  // New modal states
  const [timeslotModalOpen, setTimeslotModalOpen] = useState(false);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [editingTimeslot, setEditingTimeslot] = useState<TemplateTimeslot | null>(null);
  const [selectedTimeslot, setSelectedTimeslot] = useState<WeeklyTimeslot | null>(null);
  const [timeslotDayOfWeek, setTimeslotDayOfWeek] = useState(1);
  const [showStatsTab, setShowStatsTab] = useState(false);

  // Get Monday of current/selected week
  function getMonday(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchScheduleTemplates({ limit: 100 }),
          fetchWeeklySchedules({ 
            weekStart: currentWeek.toISOString().split('T')[0],
            weekEnd: new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
        ]);
      } catch (err) {
        notifications.show({
          title: 'Error',
          message: 'Failed to load schedule data',
          color: 'red',
        });
      }
    };

    loadData();
  }, [currentWeek, fetchScheduleTemplates, fetchWeeklySchedules]);


  // Error handling
  useEffect(() => {
    if (templatesError) {
      notifications.show({
        title: 'Templates Error',
        message: templatesError,
        color: 'red',
      });
    }
    if (schedulesError) {
      notifications.show({
        title: 'Schedules Error', 
        message: schedulesError,
        color: 'red',
      });
    }
  }, [templatesError, schedulesError]);

  // Auto-select first template if none selected
  useEffect(() => {
    if (scheduleTemplates.length > 0 && !selectedTemplate) {
      const defaultTemplate = scheduleTemplates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate);
      } else {
        setSelectedTemplate(scheduleTemplates[0]);
      }
    }
  }, [scheduleTemplates, selectedTemplate]);

  // Template handlers
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateModalOpen(true);
  };

  const handleEditTemplate = (template: ScheduleTemplate) => {
    setEditingTemplate(template);
    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (templateData: any) => {
    try {
      if (editingTemplate) {
        await updateScheduleTemplate(editingTemplate._id, templateData);
        notifications.show({
          title: 'Success',
          message: 'Template updated successfully',
          color: 'green',
        });
      } else {
        await createScheduleTemplate(templateData);
        notifications.show({
          title: 'Success',
          message: 'Template created successfully',
          color: 'green',
        });
      }
      setTemplateModalOpen(false);
      setEditingTemplate(null);
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save template',
        color: 'red',
      });
    }
  };

  // Weekly schedule handlers
  const handleCreateWeeklySchedule = () => {
    setWeeklyModalOpen(true);
  };

  const handleCopyFromTemplate = () => {
    setWeeklyModalOpen(true);
  };

  const handleSaveWeeklySchedule = async (scheduleData: any) => {
    try {
      await createWeeklySchedule(scheduleData);
      notifications.show({
        title: 'Success',
        message: 'Weekly schedule created successfully',
        color: 'green',
      });
      setWeeklyModalOpen(false);
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create weekly schedule',
        color: 'red',
      });
    }
  };

  // Timeslot handlers
  const handleAddTimeslot = (dayOfWeek: number) => {
    setTimeslotDayOfWeek(dayOfWeek);
    setEditingTimeslot(null);
    setTimeslotModalOpen(true);
  };

  const handleEditTimeslot = (timeslot: TemplateTimeslot | WeeklyTimeslot) => {
    if ('templateTimeslotId' in timeslot) {
      // This is a WeeklyTimeslot, convert to TemplateTimeslot format for editing
      const templateTimeslot: TemplateTimeslot = {
        timeslotId: timeslot.templateTimeslotId,
        dayOfWeek: timeslot.dayOfWeek,
        startTime: timeslot.startTime,
        endTime: timeslot.endTime,
        locationId: timeslot.locationId,
        coachId: timeslot.coachId,
        programId: timeslot.programId,
        maxCapacity: timeslot.maxCapacity,
        className: timeslot.className,
        notes: timeslot.notes,
        isActive: timeslot.isActive,
      };
      setEditingTimeslot(templateTimeslot);
    } else {
      setEditingTimeslot(timeslot);
    }
    setTimeslotDayOfWeek(timeslot.dayOfWeek);
    setTimeslotModalOpen(true);
  };

  const handleSaveTimeslot = async (timeslotData: Omit<TemplateTimeslot, 'timeslotId'>) => {
    try {
      if (selectedTemplate) {
        const updatedTimeslots = editingTimeslot
          ? selectedTemplate.timeslots.map(slot =>
              slot.timeslotId === editingTimeslot.timeslotId ? { ...slot, ...timeslotData } : slot
            )
          : [...selectedTemplate.timeslots, { 
              timeslotId: `new-${Date.now()}`, 
              ...timeslotData 
            }];

        await updateScheduleTemplate(selectedTemplate._id, {
          timeslots: updatedTimeslots.map(({ timeslotId, ...slot }) => slot)
        });

        notifications.show({
          title: 'Success',
          message: editingTimeslot ? 'Timeslot updated successfully' : 'Timeslot added successfully',
          color: 'green',
        });
        setTimeslotModalOpen(false);
        setEditingTimeslot(null);
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save timeslot',
        color: 'red',
      });
    }
  };

  // Enrollment handlers
  const handleEnrollClient = (timeslot: WeeklyTimeslot) => {
    setSelectedTimeslot(timeslot);
    setEnrollmentModalOpen(true);
  };

  const handleEnrollment = async (clientId: string, notes?: string) => {
    try {
      if (selectedTimeslot && selectedWeeklySchedule) {
        await enrollClient(selectedWeeklySchedule._id, selectedTimeslot.timeslotId, clientId, notes);
        notifications.show({
          title: 'Success',
          message: 'Client enrolled successfully',
          color: 'green',
        });
        setEnrollmentModalOpen(false);
        setSelectedTimeslot(null);
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to enroll client',
        color: 'red',
      });
    }
  };

  const handleCancelEnrollment = async (clientId: string) => {
    try {
      if (selectedTimeslot && selectedWeeklySchedule) {
        await cancelEnrollment(selectedWeeklySchedule._id, selectedTimeslot.timeslotId, clientId);
        notifications.show({
          title: 'Success',
          message: 'Enrollment cancelled successfully',
          color: 'green',
        });
        setEnrollmentModalOpen(false);
        setSelectedTimeslot(null);
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to cancel enrollment',
        color: 'red',
      });
    }
  };

  // Week navigation
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const goToToday = () => {
    setCurrentWeek(getMonday(new Date()));
  };

  const getWeekRangeString = (monday: Date): string => {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const mondayStr = monday.toLocaleDateString('en-US', options);
    const sundayStr = sunday.toLocaleDateString('en-US', options);
    
    if (monday.getMonth() === sunday.getMonth()) {
      return `${mondayStr} - ${sunday.getDate()}, ${monday.getFullYear()}`;
    } else {
      return `${mondayStr} - ${sundayStr}, ${monday.getFullYear()}`;
    }
  };

  const defaultTemplate = scheduleTemplates?.find(t => t.isDefault);
  const firstTemplate = scheduleTemplates?.length > 0 ? scheduleTemplates[0] : null;
  const displayTemplate = selectedTemplate || defaultTemplate || firstTemplate;
  
  const currentWeekSchedule = weeklySchedules?.find(s =>
    new Date(s.weekStartDate).getTime() === currentWeek.getTime()
  );

  return (
    <AppLayout>
      <Stack gap="md">
        {/* Header */}
        <Card>
          <Group justify="space-between">
            <div>
              <Title order={2}>Schedule Management</Title>
              <Text c="dimmed" size="sm">
                Manage schedule templates and weekly schedules
              </Text>
            </div>
          </Group>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(tab) => {
          setActiveTab(tab || 'templates');
          setSearchParams({ tab: tab || 'templates' });
        }}>
          <Card>
            <Tabs.List>
              <Tabs.Tab 
                value="templates" 
                leftSection={<IconTemplate size={16} />}
              >
                Templates
              </Tabs.Tab>
              <Tabs.Tab 
                value="schedules" 
                leftSection={<IconCalendar size={16} />}
              >
                Active Schedules
              </Tabs.Tab>
              <Tabs.Tab 
                value="statistics" 
                leftSection={<IconChevronRight size={16} />}
              >
                Statistics
              </Tabs.Tab>
            </Tabs.List>
          </Card>

          {/* Templates Tab */}
          <Tabs.Panel value="templates">
            <Stack gap="md">
              <Card>
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>Schedule Templates</Text>
                    <Text size="sm" c="dimmed">
                      Create reusable weekly schedule patterns
                    </Text>
                  </div>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreateTemplate}
                  >
                    New Template
                  </Button>
                </Group>
              </Card>

              {/* Template Selector */}
              {!templatesLoading && (
                <Card>
                  {scheduleTemplates.length > 0 ? (
                    <Select
                      label="Select Template to View/Edit"
                      placeholder="Choose a template..."
                      value={selectedTemplate?._id || ''}
                      onChange={(value) => {
                        const template = scheduleTemplates.find(t => t._id === value);
                        setSelectedTemplate(template || null);
                      }}
                      data={scheduleTemplates.map(template => ({
                        value: template._id,
                        label: `${template.name}${template.isDefault ? ' (Default)' : ''}`,
                      }))}
                    />
                  ) : (
                    <Text c="dimmed" ta="center" py="md">
                      No schedule templates found. Create your first template to get started.
                    </Text>
                  )}
                </Card>
              )}

              {/* Template Grid */}
              <WeeklyScheduleGrid
                template={displayTemplate}
                isTemplate={true}
                onAddTimeslot={handleAddTimeslot}
                onEditTimeslot={handleEditTimeslot}
              />
            </Stack>
          </Tabs.Panel>

          {/* Active Schedules Tab */}
          <Tabs.Panel value="schedules">
            <Stack gap="md">
              {/* Week Navigation */}
              <Card>
                <Group justify="space-between">
                  <Group>
                    <ActionIcon
                      variant="default"
                      onClick={goToPreviousWeek}
                      size="lg"
                    >
                      <IconChevronLeft size={16} />
                    </ActionIcon>
                    
                    <Group gap="xs">
                      <Text fw={500} size="lg">
                        {getWeekRangeString(currentWeek)}
                      </Text>
                      <Button
                        variant="light"
                        size="xs"
                        onClick={goToToday}
                      >
                        Today
                      </Button>
                    </Group>
                    
                    <ActionIcon
                      variant="default"
                      onClick={goToNextWeek}
                      size="lg"
                    >
                      <IconChevronRight size={16} />
                    </ActionIcon>
                  </Group>

                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreateWeeklySchedule}
                  >
                    Create Schedule
                  </Button>
                </Group>
              </Card>

              {/* Weekly Schedule Grid */}
              <WeeklyScheduleGrid
                weeklySchedule={currentWeekSchedule}
                isTemplate={false}
                onAddTimeslot={handleAddTimeslot}
                onEditTimeslot={handleEditTimeslot}
                onEnrollClient={handleEnrollClient}
                onCopyFromTemplate={handleCopyFromTemplate}
              />
            </Stack>
          </Tabs.Panel>

          {/* Statistics Tab */}
          <Tabs.Panel value="statistics">
            <ScheduleStatsDashboard />
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Modals */}
      <ScheduleTemplateModal
        opened={templateModalOpen}
        onClose={() => {
          setTemplateModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        template={editingTemplate}
        loading={templatesLoading}
        gymId={user?.gymId || ''}
      />

      <CreateWeeklyScheduleModal
        opened={weeklyModalOpen}
        onClose={() => setWeeklyModalOpen(false)}
        onSave={handleSaveWeeklySchedule}
        templates={scheduleTemplates}
        loading={schedulesLoading}
      />

      {/* New Modals */}
      <TimeslotModal
        opened={timeslotModalOpen}
        onClose={() => {
          setTimeslotModalOpen(false);
          setEditingTimeslot(null);
        }}
        onSave={handleSaveTimeslot}
        timeslot={editingTimeslot}
        dayOfWeek={timeslotDayOfWeek}
        loading={templatesLoading}
        gymId={user?.gymId || ''}
      />

      <TimeslotEnrollmentModal
        opened={enrollmentModalOpen}
        onClose={() => {
          setEnrollmentModalOpen(false);
          setSelectedTimeslot(null);
        }}
        onEnroll={handleEnrollment}
        onCancelEnrollment={handleCancelEnrollment}
        timeslot={selectedTimeslot}
        loading={schedulesLoading}
      />
    </AppLayout>
  );
}