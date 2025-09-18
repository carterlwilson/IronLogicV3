import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  Group,
  Title,
  Text,
  Tabs,
  Card,
  Button,
  Select
} from '@mantine/core';
import {
    IconPlus,
    IconCalendar,
    IconTemplate, IconChevronRight
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { AppLayout } from '../../components/layout/AppLayout';
import { ScheduleTemplateCalendarView } from '../../components/schedules/ScheduleTemplateCalendarView';
import { WeeklyScheduleCalendarView } from '../../components/schedules/WeeklyScheduleCalendarView';
import { ScheduleTemplateModal } from '../../components/schedules/ScheduleTemplateModal';
import { CreateWeeklyScheduleModal } from '../../components/schedules/CreateWeeklyScheduleModal';
import { TimeslotModal } from '../../components/schedules/TimeslotModal';
import { TimeslotEnrollmentModal } from '../../components/schedules/TimeslotEnrollmentModal';
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
    deleteScheduleTemplate
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


  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchScheduleTemplates({ limit: 100 }),
          fetchWeeklySchedules()
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
  }, [fetchScheduleTemplates, fetchWeeklySchedules]);


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
      setSelectedTemplate(scheduleTemplates[0]);
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
        location: timeslot.location,
        maxCapacity: timeslot.maxCapacity,
        className: timeslot.className,
        notes: timeslot.notes,
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

        const updatedTemplate = await updateScheduleTemplate(selectedTemplate._id, {
          timeslots: updatedTimeslots.map(({ timeslotId, ...slot }) => slot)
        });

        // Update the selected template with the server response
        setSelectedTemplate(updatedTemplate);

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


  const firstTemplate = scheduleTemplates?.length > 0 ? scheduleTemplates[0] : null;
  const displayTemplate = selectedTemplate || firstTemplate;

  const currentWeekSchedule = weeklySchedules?.length > 0 ? weeklySchedules[0] : null;

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
                        label: template.name,
                      }))}
                    />
                  ) : (
                    <Text c="dimmed" ta="center" py="md">
                      No schedule templates found. Create your first template to get started.
                    </Text>
                  )}
                </Card>
              )}

              {/* Template Calendar */}
              {displayTemplate && user?.gymId && (
                <ScheduleTemplateCalendarView
                  template={displayTemplate}
                  onAddTimeslot={(timeslotData) => {
                    // Convert the timeslotData to match expected format
                    handleSaveTimeslot(timeslotData);
                  }}
                  onEditTimeslot={(timeslotId, timeslotData) => {
                    // Find the timeslot to edit and call handleSaveTimeslot
                    setEditingTimeslot(displayTemplate.timeslots.find(t => t.timeslotId === timeslotId) || null);
                    handleSaveTimeslot(timeslotData);
                  }}
                  onDeleteTimeslot={async (timeslotId) => {
                    try {
                      const updatedTimeslots = displayTemplate.timeslots.filter(slot => slot.timeslotId !== timeslotId);
                      const updatedTemplate = await updateScheduleTemplate(displayTemplate._id, {
                        timeslots: updatedTimeslots.map(({ timeslotId, ...slot }) => slot)
                      });

                      // Update the selected template with the server response
                      setSelectedTemplate(updatedTemplate);

                      notifications.show({
                        title: 'Success',
                        message: 'Timeslot deleted successfully',
                        color: 'green',
                      });
                    } catch (err) {
                      notifications.show({
                        title: 'Error',
                        message: 'Failed to delete timeslot',
                        color: 'red',
                      });
                    }
                  }}
                  loading={templatesLoading}
                  gymId={user.gymId || ''}
                />
              )}
            </Stack>
          </Tabs.Panel>

          {/* Active Schedules Tab */}
          <Tabs.Panel value="schedules">
            <Stack gap="md">
              {/* Schedule Actions */}
              <Card>
                <Group justify="space-between">
                  <div>
                    <Text fw={500} size="lg">
                      Active Schedules
                    </Text>
                    <Text size="sm" c="dimmed">
                      Weekly schedules created from templates
                    </Text>
                  </div>

                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreateWeeklySchedule}
                  >
                    Create Schedule
                  </Button>
                </Group>
              </Card>

              {/* Weekly Schedule Calendar */}
              {currentWeekSchedule ? (
                <WeeklyScheduleCalendarView
                  schedule={currentWeekSchedule}
                  onViewTimeslot={handleEnrollClient}
                  onEditSchedule={() => {
                    // TODO: Add edit schedule functionality
                    notifications.show({
                      title: 'Info',
                      message: 'Edit schedule functionality will be added soon',
                      color: 'blue',
                    });
                  }}
                  loading={schedulesLoading}
                />
              ) : (
                <Card>
                  <Stack align="center" gap="md" py="xl">
                    <Text size="lg" c="dimmed">
                      No schedule for this week
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      Copy from a template or create a schedule manually
                    </Text>
                    <Group gap="sm">
                      <Button
                        leftSection={<IconPlus size={16} />}
                        variant="light"
                        onClick={handleCopyFromTemplate}
                      >
                        Copy from Template
                      </Button>
                      <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={handleCreateWeeklySchedule}
                      >
                        Create Schedule
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Modals */}
      {user?.gymId && (
        <ScheduleTemplateModal
          opened={templateModalOpen}
          onClose={() => {
            setTemplateModalOpen(false);
            setEditingTemplate(null);
          }}
          onSave={handleSaveTemplate}
          template={editingTemplate}
          loading={templatesLoading}
          gymId={user.gymId}
        />
      )}

      <CreateWeeklyScheduleModal
        opened={weeklyModalOpen}
        onClose={() => setWeeklyModalOpen(false)}
        onSave={handleSaveWeeklySchedule}
        templates={scheduleTemplates}
        gymId={user?.gymId || ''}
        loading={schedulesLoading}
      />

      {/* New Modals */}
      {user?.gymId && (
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
          gymId={user.gymId}
        />
      )}

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