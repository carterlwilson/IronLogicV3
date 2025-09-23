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
  Select,
  Menu,
  ActionIcon
} from '@mantine/core';
import {
    IconPlus,
    IconCalendar,
    IconTemplate, IconChevronRight, IconEdit, IconTrash, IconDots
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { AppLayout } from '../../components/layout/AppLayout';
import { ScheduleTemplateCalendarView } from '../../components/schedules/ScheduleTemplateCalendarView';
import { WeeklyScheduleCalendarView } from '../../components/schedules/WeeklyScheduleCalendarView';
import { ScheduleTemplateModal } from '../../components/schedules/ScheduleTemplateModal';
import { CreateWeeklyScheduleModal } from '../../components/schedules/CreateWeeklyScheduleModal';
import { TimeslotModal } from '../../components/schedules/TimeslotModal';
import { TimeslotEnrollmentModal } from '../../components/schedules/TimeslotEnrollmentModal';
import { EditWeeklyScheduleModal } from '../../components/schedules/EditWeeklyScheduleModal';
import { WeeklyTimeslotModal } from '../../components/schedules/WeeklyTimeslotModal';
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
  const [editScheduleModalOpen, setEditScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WeeklySchedule | null>(null);
  const [weeklyTimeslotModalOpen, setWeeklyTimeslotModalOpen] = useState(false);
  const [editingWeeklyTimeslot, setEditingWeeklyTimeslot] = useState<WeeklyTimeslot | null>(null);
  const [weeklyTimeslotDayOfWeek, setWeeklyTimeslotDayOfWeek] = useState(1);


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

  const handleDeleteTemplate = async (template: ScheduleTemplate) => {
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteScheduleTemplate(template._id);

      // Clear selection if deleted template was selected
      if (selectedTemplate?._id === template._id) {
        setSelectedTemplate(null);
      }

      notifications.show({
        title: 'Success',
        message: 'Template deleted successfully',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete template',
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

  // Edit schedule handlers
  const handleEditSchedule = (schedule: WeeklySchedule) => {
    setEditingSchedule(schedule);
    setEditScheduleModalOpen(true);
  };

  const handleUpdateSchedule = async (scheduleData: any) => {
    try {
      if (editingSchedule) {
        const updatedSchedule = await updateWeeklySchedule(editingSchedule._id, scheduleData);

        // Update selected schedule if it's the one being edited
        if (selectedWeeklySchedule?._id === editingSchedule._id) {
          setSelectedWeeklySchedule(updatedSchedule);
        }

        notifications.show({
          title: 'Success',
          message: 'Schedule updated successfully',
          color: 'green',
        });
        setEditScheduleModalOpen(false);
        setEditingSchedule(null);
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update schedule',
        color: 'red',
      });
    }
  };

  const handleDeleteSchedule = async (schedule: WeeklySchedule) => {
    try {
      await deleteWeeklySchedule(schedule._id);

      // Clear selection if deleted schedule was selected
      if (selectedWeeklySchedule?._id === schedule._id) {
        setSelectedWeeklySchedule(null);
      }

      notifications.show({
        title: 'Success',
        message: 'Schedule deleted successfully',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete schedule',
        color: 'red',
      });
    }
  };

  // Weekly Schedule Timeslot handlers
  const handleAddWeeklyTimeslot = (dayOfWeek: number) => {
    setWeeklyTimeslotDayOfWeek(dayOfWeek);
    setEditingWeeklyTimeslot(null);
    setWeeklyTimeslotModalOpen(true);
  };

  const handleEditWeeklyTimeslot = (timeslot: WeeklyTimeslot) => {
    setEditingWeeklyTimeslot(timeslot);
    setWeeklyTimeslotDayOfWeek(timeslot.dayOfWeek);
    setWeeklyTimeslotModalOpen(true);
  };

  const handleSaveWeeklyTimeslot = async (timeslotData: any) => {
    try {
      if (selectedWeeklySchedule) {
        const updatedTimeslots = editingWeeklyTimeslot
          ? selectedWeeklySchedule.timeslots.map(slot =>
              slot.timeslotId === editingWeeklyTimeslot.timeslotId
                ? { ...slot, ...timeslotData }
                : slot
            )
          : [...selectedWeeklySchedule.timeslots, {
              timeslotId: `new-${Date.now()}`,
              templateTimeslotId: `new-${Date.now()}`,
              enrollments: [],
              ...timeslotData
            }];

        const updatedSchedule = await updateWeeklySchedule(selectedWeeklySchedule._id, {
          timeslots: updatedTimeslots
        });

        // Update the selected schedule with the server response
        setSelectedWeeklySchedule(updatedSchedule);

        notifications.show({
          title: 'Success',
          message: editingWeeklyTimeslot ? 'Timeslot updated successfully' : 'Timeslot added successfully',
          color: 'green',
        });
        setWeeklyTimeslotModalOpen(false);
        setEditingWeeklyTimeslot(null);
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save timeslot',
        color: 'red',
      });
    }
  };

  const handleDeleteWeeklyTimeslot = async (timeslot: WeeklyTimeslot) => {
    try {
      if (selectedWeeklySchedule) {
        const updatedTimeslots = selectedWeeklySchedule.timeslots.filter(
          slot => slot.timeslotId !== timeslot.timeslotId
        );

        const updatedSchedule = await updateWeeklySchedule(selectedWeeklySchedule._id, {
          timeslots: updatedTimeslots
        });

        // Update the selected schedule with the server response
        setSelectedWeeklySchedule(updatedSchedule);

        notifications.show({
          title: 'Success',
          message: 'Timeslot deleted successfully',
          color: 'green',
        });
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete timeslot',
        color: 'red',
      });
    }
  };

  // Check if user can manage timeslots (gym owners and admins)
  const canManageTimeslots = user?.userType === 'gym_owner' || user?.userType === 'admin';

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

  // Auto-select first schedule if none selected
  useEffect(() => {
    if (weeklySchedules.length > 0 && !selectedWeeklySchedule) {
      setSelectedWeeklySchedule(weeklySchedules[0]);
    }
  }, [weeklySchedules, selectedWeeklySchedule]);

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
                    <Group align="flex-end" gap="md">
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
                        style={{ flex: 1 }}
                      />
                      {selectedTemplate && canManageTimeslots && (
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon size="lg" variant="light">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => handleEditTemplate(selectedTemplate)}
                            >
                              Edit Template
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color="red"
                              onClick={() => handleDeleteTemplate(selectedTemplate)}
                            >
                              Delete Template
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      )}
                    </Group>
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

              {/* Schedule Selector */}
              {!schedulesLoading && (
                <Card>
                  {weeklySchedules.length > 0 ? (
                    <Group align="flex-end" gap="md">
                      <Select
                        label="Select Active Schedule to View/Edit"
                        placeholder="Choose a schedule..."
                        value={selectedWeeklySchedule?._id || ''}
                        onChange={(value) => {
                          const schedule = weeklySchedules.find(s => s._id === value);
                          setSelectedWeeklySchedule(schedule || null);
                        }}
                        data={weeklySchedules.map(schedule => ({
                          value: schedule._id,
                          label: `${schedule.templateId?.name || 'Unnamed'} - ${schedule.status}`,
                        }))}
                        style={{ flex: 1 }}
                      />
                      {selectedWeeklySchedule && (
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon size="lg" variant="light">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => handleEditSchedule(selectedWeeklySchedule)}
                            >
                              Edit Schedule
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color="red"
                              onClick={() => handleDeleteSchedule(selectedWeeklySchedule)}
                            >
                              Delete Schedule
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      )}
                    </Group>
                  ) : (
                    <Text c="dimmed" ta="center" py="md">
                      No active schedules found. Create your first schedule to get started.
                    </Text>
                  )}
                </Card>
              )}

              {/* Weekly Schedule Calendar */}
              {selectedWeeklySchedule ? (
                <WeeklyScheduleCalendarView
                  schedule={selectedWeeklySchedule}
                  onViewTimeslot={handleEnrollClient}
                  onEditSchedule={() => handleEditSchedule(selectedWeeklySchedule)}
                  onAddTimeslot={handleAddWeeklyTimeslot}
                  onEditTimeslot={handleEditWeeklyTimeslot}
                  onDeleteTimeslot={handleDeleteWeeklyTimeslot}
                  canManageTimeslots={canManageTimeslots}
                  loading={schedulesLoading}
                />
              ) : (
                <Card>
                  <Stack align="center" gap="md" py="xl">
                    <Text size="lg" c="dimmed">
                      No active schedules available
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      Create a schedule from a template to get started
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

      <EditWeeklyScheduleModal
        opened={editScheduleModalOpen}
        onClose={() => {
          setEditScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        onSave={handleUpdateSchedule}
        schedule={editingSchedule}
        gymId={user?.gymId || ''}
        loading={schedulesLoading}
      />

      {user?.gymId && (
        <WeeklyTimeslotModal
          opened={weeklyTimeslotModalOpen}
          onClose={() => {
            setWeeklyTimeslotModalOpen(false);
            setEditingWeeklyTimeslot(null);
          }}
          onSave={handleSaveWeeklyTimeslot}
          timeslot={editingWeeklyTimeslot}
          dayOfWeek={weeklyTimeslotDayOfWeek}
          loading={schedulesLoading}
          gymId={user.gymId}
        />
      )}
    </AppLayout>
  );
}