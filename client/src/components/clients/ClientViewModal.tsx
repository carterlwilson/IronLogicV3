'use client';

import {
  Modal,
  Text,
  Badge,
  Stack,
  Group,
  Paper,
  Grid,
  Divider,
  Button,
  Avatar,
  Progress,
  Alert,
  Anchor,
  Center
} from '@mantine/core';
import {
  IconEdit,
  IconUser,
  IconMail,
  IconPhone,
  IconCalendar,
  IconTarget,
  IconActivity,
  IconUsers,
  IconBarbell,
  IconClipboard,
  IconAlertTriangle,
  IconPlus,
  IconMedicalCross,
  IconHeart
} from '@tabler/icons-react';
import type { Client } from '../../lib/clients-api';
import { clientHelpers } from '../../lib/clients-api';

interface ClientViewModalProps {
  opened: boolean;
  onClose: () => void;
  onEdit: () => void;
  client: Client | null;
}

const getMembershipStatusBadge = (isActive: boolean) => {
  return (
    <Badge color={isActive ? 'green' : 'red'} variant="light" size="sm">
      {isActive ? 'Active Member' : 'Inactive Member'}
    </Badge>
  );
};

const getAccountStatusBadge = (isActive: boolean) => {
  return (
    <Badge color={isActive ? 'blue' : 'gray'} variant="outline" size="sm">
      {isActive ? 'Account Active' : 'Account Suspended'}
    </Badge>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDateShort = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatPhoneNumber = (phone: string) => {
  // Simple phone formatting - can be enhanced
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export function ClientViewModal({
  opened,
  onClose,
  onEdit,
  client
}: ClientViewModalProps) {
  if (!client) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title="Client Profile"
        size="xl"
        centered
      >
        <Center py="xl">
          <Text c="dimmed">No client data available</Text>
        </Center>
      </Modal>
    );
  }

  const clientName = clientHelpers.getClientDisplayName(client);
  const isActive = clientHelpers.isClientActive(client);
  const programCompletion = clientHelpers.calculateProgramCompletion(client.currentProgram);

  // Get client initials for avatar
  const initials = clientName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Client Profile"
      size="xl"
      centered
      scrollAreaComponent={Modal.Scrollarea}
      transitionProps={{ transition: 'fade', duration: 200 }}
    >
      <Stack gap="lg">
        {/* Header Section */}
        <Group justify="space-between">
          <Group gap="md">
            <Avatar color="blue" radius="md" size="lg">
              {initials}
            </Avatar>
            <div>
              <Text size="xl" fw={600}>{clientName}</Text>
              <Group gap="xs" mt="xs">
                {getMembershipStatusBadge(client.membershipInfo.isActive)}
                {client.user && getAccountStatusBadge(client.user.isActive)}
              </Group>
            </div>
          </Group>
          <Button
            leftSection={<IconEdit size="1rem" />}
            onClick={onEdit}
            variant="light"
          >
            Edit Client
          </Button>
        </Group>

        <Divider />

        {/* Account Information */}
        <Paper p="md" withBorder>
          <Text size="lg" fw={500} mb="md">Account Information</Text>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs" mb="sm">
                <IconUser size="1rem" color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={500}>Full Name</Text>
              </Group>
              <Text size="sm" c="dimmed">{clientName}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs" mb="sm">
                <IconMail size="1rem" color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={500}>Email Address</Text>
              </Group>
              <Text size="sm" c="dimmed">
                {client.user?.email ? (
                  <Anchor href={`mailto:${client.user.email}`}>
                    {client.user.email}
                  </Anchor>
                ) : (
                  'No email provided'
                )}
              </Text>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Personal Information */}
        <Paper p="md" withBorder>
          <Text size="lg" fw={500} mb="md">Personal Information</Text>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs" mb="sm">
                <IconPhone size="1rem" color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={500}>Phone Number</Text>
              </Group>
              <Text size="sm" c="dimmed">
                {client.personalInfo.phone ? (
                  <Anchor href={`tel:${client.personalInfo.phone}`}>
                    {formatPhoneNumber(client.personalInfo.phone)}
                  </Anchor>
                ) : (
                  'No phone number provided'
                )}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs" mb="sm">
                <IconCalendar size="1rem" color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={500}>Date of Birth</Text>
              </Group>
              <Text size="sm" c="dimmed">
                {client.personalInfo.dateOfBirth
                  ? formatDate(client.personalInfo.dateOfBirth)
                  : 'Not provided'
                }
              </Text>
            </Grid.Col>
          </Grid>

          {/* Emergency Contact */}
          {client.personalInfo.emergencyContact && (
            <>
              <Divider my="md" />
              <Text size="md" fw={500} mb="sm">Emergency Contact</Text>
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Text size="sm" fw={500}>Name</Text>
                  <Text size="sm" c="dimmed">{client.personalInfo.emergencyContact.name}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Text size="sm" fw={500}>Phone</Text>
                  <Text size="sm" c="dimmed">
                    <Anchor href={`tel:${client.personalInfo.emergencyContact.phone}`}>
                      {formatPhoneNumber(client.personalInfo.emergencyContact.phone)}
                    </Anchor>
                  </Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Text size="sm" fw={500}>Relationship</Text>
                  <Text size="sm" c="dimmed">{client.personalInfo.emergencyContact.relationship}</Text>
                </Grid.Col>
              </Grid>
            </>
          )}
        </Paper>

        {/* Membership Information */}
        <Paper p="md" withBorder>
          <Text size="lg" fw={500} mb="md">Membership Information</Text>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs" mb="sm">
                <IconCalendar size="1rem" color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={500}>Join Date</Text>
              </Group>
              <Text size="sm" c="dimmed">{formatDate(client.membershipInfo.joinDate)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs" mb="sm">
                <IconTarget size="1rem" color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={500}>Membership Type</Text>
              </Group>
              <Text size="sm" c="dimmed">
                {client.membershipInfo.membershipType || 'Standard Membership'}
              </Text>
            </Grid.Col>
          </Grid>

          {/* Freeze History */}
          {client.membershipInfo.freezeHistory && client.membershipInfo.freezeHistory.length > 0 && (
            <>
              <Divider my="md" />
              <Text size="md" fw={500} mb="sm">Membership Freeze History</Text>
              <Stack gap="xs">
                {client.membershipInfo.freezeHistory.map((freeze, index) => (
                  <Group key={index} justify="space-between">
                    <div>
                      <Text size="sm">
                        {formatDateShort(freeze.startDate)} - {freeze.endDate ? formatDateShort(freeze.endDate) : 'Ongoing'}
                      </Text>
                      {freeze.reason && <Text size="xs" c="dimmed">{freeze.reason}</Text>}
                    </div>
                    <Badge color="orange" variant="light" size="xs">
                      {freeze.endDate ? 'Completed' : 'Active'}
                    </Badge>
                  </Group>
                ))}
              </Stack>
            </>
          )}
        </Paper>

        {/* Current Program */}
        {client.currentProgram ? (
          <Paper p="md" withBorder>
            <Text size="lg" fw={500} mb="md">Current Program</Text>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Group gap="xs" mb="sm">
                  <IconBarbell size="1rem" color="var(--mantine-color-blue-6)" />
                  <Text size="sm" fw={500}>Program</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  {client.program?.name || 'Program details loading...'}
                </Text>
                {client.program?.description && (
                  <Text size="xs" c="dimmed" mt="xs">{client.program.description}</Text>
                )}
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Group gap="xs" mb="sm">
                  <IconActivity size="1rem" color="var(--mantine-color-blue-6)" />
                  <Text size="sm" fw={500}>Progress</Text>
                </Group>
                <Progress value={programCompletion} mb="xs" />
                <Text size="xs" c="dimmed">{programCompletion}% complete</Text>
              </Grid.Col>
            </Grid>
            <Grid mt="md">
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Text size="sm" fw={500}>Week</Text>
                <Text size="sm" c="dimmed">{client.currentProgram.currentWeek}</Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Text size="sm" fw={500}>Day</Text>
                <Text size="sm" c="dimmed">{client.currentProgram.currentDay}</Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Text size="sm" fw={500}>Started</Text>
                <Text size="sm" c="dimmed">{formatDateShort(client.currentProgram.startDate)}</Text>
              </Grid.Col>
            </Grid>
            {client.currentProgram.notes && (
              <>
                <Divider my="md" />
                <Text size="sm" fw={500} mb="xs">Notes</Text>
                <Text size="sm" c="dimmed">{client.currentProgram.notes}</Text>
              </>
            )}
          </Paper>
        ) : (
          <Paper p="md" withBorder>
            <Group justify="space-between" align="center">
              <div>
                <Text size="lg" fw={500}>Current Program</Text>
                <Text size="sm" c="dimmed">No program assigned</Text>
              </div>
              <Button
                leftSection={<IconPlus size="1rem" />}
                variant="light"
                size="sm"
              >
                Assign Program
              </Button>
            </Group>
          </Paper>
        )}

        {/* Health & Fitness Information */}
        {(client.personalInfo.fitnessGoals?.length || client.personalInfo.medicalConditions?.length) && (
          <Paper p="md" withBorder>
            <Text size="lg" fw={500} mb="md">Health & Fitness Information</Text>
            <Grid gutter="md">
              {client.personalInfo.fitnessGoals && client.personalInfo.fitnessGoals.length > 0 && (
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Group gap="xs" mb="sm">
                    <IconHeart size="1rem" color="var(--mantine-color-blue-6)" />
                    <Text size="sm" fw={500}>Fitness Goals</Text>
                  </Group>
                  <Stack gap="xs">
                    {client.personalInfo.fitnessGoals.map((goal, index) => (
                      <Badge key={index} variant="light" color="blue" size="sm">
                        {goal}
                      </Badge>
                    ))}
                  </Stack>
                </Grid.Col>
              )}
              {client.personalInfo.medicalConditions && client.personalInfo.medicalConditions.length > 0 && (
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Group gap="xs" mb="sm">
                    <IconMedicalCross size="1rem" color="var(--mantine-color-red-6)" />
                    <Text size="sm" fw={500}>Medical Conditions</Text>
                  </Group>
                  <Stack gap="xs">
                    {client.personalInfo.medicalConditions.map((condition, index) => (
                      <Alert key={index} color="red" variant="light" p="xs">
                        <Text size="sm">{condition}</Text>
                      </Alert>
                    ))}
                  </Stack>
                </Grid.Col>
              )}
            </Grid>
          </Paper>
        )}

        {/* Benchmark Summary */}
        {client.activeBenchmarks && client.activeBenchmarks.length > 0 && (
          <Paper p="md" withBorder>
            <Group justify="space-between" align="center" mb="md">
              <Text size="lg" fw={500}>Active Benchmarks</Text>
              <Button
                leftSection={<IconPlus size="1rem" />}
                variant="light"
                size="sm"
              >
                Add Benchmark
              </Button>
            </Group>
            <Grid gutter="md">
              {client.activeBenchmarks.map((benchmark, index) => (
                <Grid.Col key={index} span={6}>
                  <Paper p="sm" withBorder radius="sm">
                    <Text size="sm" fw={500} mb="xs">
                      {benchmark.template?.name || 'Unknown Exercise'}
                    </Text>
                    <Group justify="space-between">
                      <div>
                        <Text size="xs" c="dimmed">Current</Text>
                        <Text size="sm">
                          {benchmark.currentValue ?
                            clientHelpers.formatBenchmarkValue(benchmark.currentValue, benchmark.template) :
                            'Not set'
                          }
                        </Text>
                      </div>
                      {benchmark.targetValue && (
                        <div>
                          <Text size="xs" c="dimmed">Target</Text>
                          <Text size="sm">
                            {clientHelpers.formatBenchmarkValue(benchmark.targetValue, benchmark.template)}
                          </Text>
                        </div>
                      )}
                    </Group>
                    {benchmark.lastUpdated && (
                      <Text size="xs" c="dimmed" mt="xs">
                        Updated {formatDateShort(benchmark.lastUpdated)}
                      </Text>
                    )}
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Coach Assignments */}
        {client.coachAssignments && client.coachAssignments.length > 0 && (
          <Paper p="md" withBorder>
            <Text size="lg" fw={500} mb="md">Coach Assignments</Text>
            <Stack gap="sm">
              {client.coachAssignments.map((assignment, index) => (
                <Group key={index} justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>Coach ID: {assignment.coachId}</Text>
                    {assignment.specialization && (
                      <Text size="xs" c="dimmed">{assignment.specialization}</Text>
                    )}
                    <Text size="xs" c="dimmed">
                      Assigned {formatDateShort(assignment.assignedDate)}
                    </Text>
                  </div>
                  <Badge
                    color={assignment.isActive ? 'green' : 'gray'}
                    variant="light"
                    size="sm"
                  >
                    {assignment.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Quick Actions */}
        <Paper p="md" withBorder>
          <Text size="lg" fw={500} mb="md">Quick Actions</Text>
          <Group>
            <Button
              leftSection={<IconMail size="1rem" />}
              variant="light"
              size="sm"
              disabled={!client.user?.email}
              component="a"
              href={client.user?.email ? `mailto:${client.user.email}` : undefined}
            >
              Send Email
            </Button>
            <Button
              leftSection={<IconPhone size="1rem" />}
              variant="light"
              size="sm"
              disabled={!client.personalInfo.phone}
              component="a"
              href={client.personalInfo.phone ? `tel:${client.personalInfo.phone}` : undefined}
            >
              Call Client
            </Button>
            <Button
              leftSection={<IconClipboard size="1rem" />}
              variant="light"
              size="sm"
            >
              View History
            </Button>
          </Group>
        </Paper>

        {/* Account Created Information */}
        <Paper p="md" withBorder>
          <Text size="lg" fw={500} mb="md">Account Information</Text>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs" mb="sm">
                <IconCalendar size="1rem" color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={500}>Account Created</Text>
              </Group>
              <Text size="sm" c="dimmed">{formatDate(client.createdAt)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs" mb="sm">
                <IconCalendar size="1rem" color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={500}>Last Updated</Text>
              </Group>
              <Text size="sm" c="dimmed">{formatDate(client.updatedAt)}</Text>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Warning for inactive clients */}
        {!isActive && (
          <Alert icon={<IconAlertTriangle size="1rem" />} color="red" variant="light">
            <Text size="sm">
              This client's account or membership is inactive. They may not be able to access services or book classes.
            </Text>
          </Alert>
        )}
      </Stack>
    </Modal>
  );
}