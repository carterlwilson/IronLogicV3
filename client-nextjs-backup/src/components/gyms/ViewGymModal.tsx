'use client';

import {
  Modal,
  Text,
  Badge,
  Stack,
  Group,
  Paper,
  Grid,
  Button,
  Accordion,
  List,
  Avatar,
  Anchor,
  Card,
  ScrollArea
} from '@mantine/core';
import { 
  IconBuilding, 
 
  IconMail, 
  IconPhone, 
  IconWorld, 
  IconMapPin,
  IconCalendar,
  IconEdit,
  IconUsers,
  IconClock,
  IconCurrencyDollar,
  IconSettings,
  IconLocation,
  IconShield
} from '@tabler/icons-react';
import { Gym } from '../../lib/gyms-api';
import { useAuth } from '../../lib/auth-context';

interface ViewGymModalProps {
  opened: boolean;
  onClose: () => void;
  onEdit: () => void;
  gym: Gym | null;
}

export function ViewGymModal({
  opened,
  onClose,
  onEdit,
  gym
}: ViewGymModalProps) {
  const { user } = useAuth();

  if (!gym) return null;

  // Format address for display
  const formatAddress = (gym: Gym): string => {
    if (!gym.address) return 'No address specified';
    const { street, city, state, zipCode, country } = gym.address;
    const parts = [street, city, state, zipCode, country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No address specified';
  };

  // Format operating hours
  const formatOperatingHours = (hours: any): string[] => {
    if (!hours) return ['Not specified'];
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return days.map((day, index) => {
      const dayHours = hours[day];
      if (!dayHours || !dayHours.open || !dayHours.close) {
        return `${dayNames[index]}: Closed`;
      }
      return `${dayNames[index]}: ${dayHours.open} - ${dayHours.close}`;
    });
  };

  // Get status badge
  const getStatusBadge = (gym: Gym) => {
    if (!gym.subscription) {
      return <Badge color="gray" variant="light" size="lg">No Subscription</Badge>;
    }
    
    const statusColors = {
      active: 'green',
      trial: 'blue',
      expired: 'red',
      cancelled: 'orange'
    };
    
    return (
      <Badge 
        color={statusColors[gym.subscription.status as keyof typeof statusColors] || 'gray'} 
        variant="light" 
        size="lg"
      >
        {gym.subscription.status.charAt(0).toUpperCase() + gym.subscription.status.slice(1)}
      </Badge>
    );
  };

  // Check if user can edit
  const canEdit = user?.userType === 'admin' || (user?.userType === 'gym_owner' && gym.ownerId?._id === user._id);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Gym Details"
      size="lg"
      centered
    >
      <ScrollArea h={600}>
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <div>
              <Group align="center" gap="xs" mb="xs">
                <IconBuilding size="1.5rem" color="var(--mantine-color-blue-6)" />
                <Text size="xl" fw={600}>{gym.name}</Text>
              </Group>
              <Group gap="sm">
                {getStatusBadge(gym)}
                <Badge 
                  color={gym.isActive ? 'green' : 'red'}
                  variant="outline"
                  size="sm"
                >
                  {gym.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </Group>
            </div>
            
            {canEdit && (
              <Button
                leftSection={<IconEdit size="1rem" />}
                onClick={onEdit}
                variant="light"
              >
                Edit Gym
              </Button>
            )}
          </Group>

          {/* Description */}
          {gym.description && (
            <Paper p="md" withBorder>
              <Text size="lg" fw={500} mb="sm">Description</Text>
              <Text size="sm" c="dimmed">
                {gym.description}
              </Text>
            </Paper>
          )}

          {/* Contact & Location Information */}
          <Paper p="md" withBorder>
            <Text size="lg" fw={500} mb="md">Contact & Location</Text>
            <Grid>
              {gym.email && (
                <Grid.Col span={6}>
                  <Group gap="xs" mb="sm">
                    <IconMail size="1rem" color="var(--mantine-color-blue-6)" />
                    <Text size="sm" fw={500}>Email</Text>
                  </Group>
                  <Anchor href={`mailto:${gym.email}`} size="sm">
                    {gym.email}
                  </Anchor>
                </Grid.Col>
              )}
              
              {gym.phone && (
                <Grid.Col span={6}>
                  <Group gap="xs" mb="sm">
                    <IconPhone size="1rem" color="var(--mantine-color-blue-6)" />
                    <Text size="sm" fw={500}>Phone</Text>
                  </Group>
                  <Anchor href={`tel:${gym.phone}`} size="sm">
                    {gym.phone}
                  </Anchor>
                </Grid.Col>
              )}
              
              {gym.website && (
                <Grid.Col span={12}>
                  <Group gap="xs" mb="sm">
                    <IconWorld size="1rem" color="var(--mantine-color-blue-6)" />
                    <Text size="sm" fw={500}>Website</Text>
                  </Group>
                  <Anchor href={gym.website} target="_blank" size="sm">
                    {gym.website}
                  </Anchor>
                </Grid.Col>
              )}
              
              <Grid.Col span={12}>
                <Group gap="xs" mb="sm">
                  <IconMapPin size="1rem" color="var(--mantine-color-blue-6)" />
                  <Text size="sm" fw={500}>Address</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  {formatAddress(gym)}
                </Text>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Owner Information */}
          <Paper p="md" withBorder>
            <Text size="lg" fw={500} mb="md">Gym Owner</Text>
            {gym.ownerId ? (
              <Group gap="md">
                <Avatar size="lg" color="blue">
                  {gym.ownerId.name.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Text size="sm" fw={500}>{gym.ownerId.name}</Text>
                  <Text size="sm" c="dimmed">{gym.ownerId.email}</Text>
                  <Badge size="xs" color="blue" variant="light" mt="xs">
                    Gym Owner
                  </Badge>
                </div>
              </Group>
            ) : (
              <Group gap="md">
                <Avatar size="lg" color="gray">
                  ?
                </Avatar>
                <div>
                  <Text size="sm" fw={500} c="dimmed">No Owner Assigned</Text>
                  <Text size="sm" c="dimmed">Owner can be assigned during gym editing</Text>
                  <Badge size="xs" color="gray" variant="light" mt="xs">
                    Pending Assignment
                  </Badge>
                </div>
              </Group>
            )}
          </Paper>

          {/* Statistics */}
          <Paper p="md" withBorder>
            <Text size="lg" fw={500} mb="md">Statistics</Text>
            <Grid>
              <Grid.Col span={4} ta="center">
                <Card padding="md" withBorder>
                  <Group gap="xs" justify="center" align="center" mb="xs">
                    <IconUsers size="1.2rem" color="var(--mantine-color-blue-6)" />
                    <Text size="xl" fw={700} c="blue">
                      {gym.statistics.totalMembers}
                    </Text>
                  </Group>
                  <Text size="sm" c="dimmed">Total Members</Text>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={4} ta="center">
                <Card padding="md" withBorder>
                  <Text size="xl" fw={700} c="green" mb="xs">
                    {gym.statistics.coachCount}
                  </Text>
                  <Text size="sm" c="dimmed">Coaches</Text>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={4} ta="center">
                <Card padding="md" withBorder>
                  <Text size="xl" fw={700} c="orange" mb="xs">
                    {gym.locations.filter(loc => loc.isActive).length}
                  </Text>
                  <Text size="sm" c="dimmed">Active Locations</Text>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={6} ta="center">
                <Card padding="md" withBorder>
                  <Text size="lg" fw={600} c="purple" mb="xs">
                    {gym.statistics.activePrograms}
                  </Text>
                  <Text size="sm" c="dimmed">Active Programs</Text>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={6} ta="center">
                <Card padding="md" withBorder>
                  <Text size="lg" fw={600} c="teal" mb="xs">
                    {gym.statistics.clientCount}
                  </Text>
                  <Text size="sm" c="dimmed">Active Clients</Text>
                </Card>
              </Grid.Col>
            </Grid>
            
            {gym.statistics.lastUpdated && (
              <Text size="xs" c="dimmed" ta="center" mt="md">
                Last updated: {new Date(gym.statistics.lastUpdated).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            )}
          </Paper>

          {/* Locations */}
          {gym.locations.length > 0 && (
            <Paper p="md" withBorder>
              <Text size="lg" fw={500} mb="md">Locations</Text>
              <Stack gap="md">
                {gym.locations.filter(loc => loc.isActive).map((location) => (
                  <Card key={location.locationId} padding="md" withBorder>
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Group gap="xs" mb="xs">
                          <IconLocation size="1rem" color="var(--mantine-color-blue-6)" />
                          <Text fw={500}>{location.name}</Text>
                          <Badge color="green" variant="light" size="xs">
                            Active
                          </Badge>
                        </Group>
                        
                        {location.address && (
                          <Text size="sm" c="dimmed" mb="xs">
                            {[
                              location.address.street,
                              location.address.city,
                              location.address.state,
                              location.address.zipCode
                            ].filter(Boolean).join(', ')}
                          </Text>
                        )}
                        
                        {location.capacity && (
                          <Text size="sm" c="dimmed">
                            Capacity: {location.capacity} people
                          </Text>
                        )}
                        
                        {location.amenities && location.amenities.length > 0 && (
                          <div>
                            <Text size="sm" fw={500} mt="xs" mb="xs">Amenities:</Text>
                            <Group gap="xs">
                              {location.amenities.map((amenity, index) => (
                                <Badge key={index} variant="outline" size="xs">
                                  {amenity}
                                </Badge>
                              ))}
                            </Group>
                          </div>
                        )}
                        
                        {location.operatingHours && (
                          <div>
                            <Text size="sm" fw={500} mt="xs" mb="xs">Operating Hours:</Text>
                            <List size="xs">
                              {formatOperatingHours(location.operatingHours).map((hours, index) => (
                                <List.Item key={index}>
                                  <Text size="xs" c="dimmed">{hours}</Text>
                                </List.Item>
                              ))}
                            </List>
                          </div>
                        )}
                      </div>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Settings & Subscription */}
          <Accordion variant="contained">
            <Accordion.Item value="settings">
              <Accordion.Control>
                <Group gap="xs">
                  <IconSettings size="1rem" />
                  <Text fw={500}>Settings & Configuration</Text>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <Grid>
                    <Grid.Col span={6}>
                      <Group gap="xs" mb="xs">
                        <IconClock size="1rem" color="var(--mantine-color-blue-6)" />
                        <Text size="sm" fw={500}>Timezone</Text>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {gym.settings.timezone || 'Not specified'}
                      </Text>
                    </Grid.Col>
                    
                    <Grid.Col span={6}>
                      <Group gap="xs" mb="xs">
                        <IconCurrencyDollar size="1rem" color="var(--mantine-color-blue-6)" />
                        <Text size="sm" fw={500}>Currency</Text>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {gym.settings.currency || 'Not specified'}
                      </Text>
                    </Grid.Col>
                  </Grid>

                  <div>
                    <Text size="sm" fw={500} mb="xs">Membership Types</Text>
                    {gym.settings.membershipTypes && gym.settings.membershipTypes.length > 0 ? (
                      <Group gap="xs">
                        {gym.settings.membershipTypes.map((type, index) => (
                          <Badge key={index} variant="outline" size="sm">
                            {type}
                          </Badge>
                        ))}
                      </Group>
                    ) : (
                      <Text size="sm" c="dimmed">No membership types defined</Text>
                    )}
                  </div>

                  <Grid>
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500}>Default Class Capacity</Text>
                      <Text size="sm" c="dimmed">
                        {gym.settings.classCapacityDefault || 'Not specified'} people
                      </Text>
                    </Grid.Col>
                    
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500}>Booking Window</Text>
                      <Text size="sm" c="dimmed">
                        {gym.settings.bookingWindowDays || 'Not specified'} days in advance
                      </Text>
                    </Grid.Col>
                  </Grid>

                  {gym.settings.cancellationPolicy && (
                    <div>
                      <Text size="sm" fw={500} mb="xs">Cancellation Policy</Text>
                      <Stack gap="xs">
                        <Text size="sm" c="dimmed">
                          Status: {gym.settings.cancellationPolicy.enabled ? 'Enabled' : 'Disabled'}
                        </Text>
                        {gym.settings.cancellationPolicy.enabled && (
                          <>
                            <Text size="sm" c="dimmed">
                              Cancel before: {gym.settings.cancellationPolicy.hoursBefore} hours
                            </Text>
                            <Text size="sm" c="dimmed">
                              Penalty: {gym.settings.cancellationPolicy.penaltyType === 'none' 
                                ? 'No penalty' 
                                : gym.settings.cancellationPolicy.penaltyType === 'fee'
                                  ? `$${gym.settings.cancellationPolicy.penaltyAmount || 0} fee`
                                  : 'Credit loss'
                              }
                            </Text>
                          </>
                        )}
                      </Stack>
                    </div>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {gym.subscription && (
              <Accordion.Item value="subscription">
                <Accordion.Control>
                  <Group gap="xs">
                    <IconShield size="1rem" />
                    <Text fw={500}>Subscription Details</Text>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Grid>
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500}>Plan</Text>
                      <Text size="sm" c="dimmed">{gym.subscription.plan}</Text>
                    </Grid.Col>
                    
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500}>Status</Text>
                      <Badge 
                        color={
                          gym.subscription.status === 'active' ? 'green' :
                          gym.subscription.status === 'trial' ? 'blue' :
                          gym.subscription.status === 'expired' ? 'red' : 'orange'
                        }
                        variant="light"
                        size="sm"
                      >
                        {gym.subscription.status.charAt(0).toUpperCase() + gym.subscription.status.slice(1)}
                      </Badge>
                    </Grid.Col>
                    
                    {gym.subscription.startDate && (
                      <Grid.Col span={6}>
                        <Text size="sm" fw={500}>Start Date</Text>
                        <Text size="sm" c="dimmed">
                          {new Date(gym.subscription.startDate).toLocaleDateString()}
                        </Text>
                      </Grid.Col>
                    )}
                    
                    {gym.subscription.endDate && (
                      <Grid.Col span={6}>
                        <Text size="sm" fw={500}>End Date</Text>
                        <Text size="sm" c="dimmed">
                          {new Date(gym.subscription.endDate).toLocaleDateString()}
                        </Text>
                      </Grid.Col>
                    )}
                    
                    {gym.subscription.maxMembers && (
                      <Grid.Col span={12}>
                        <Text size="sm" fw={500}>Member Limit</Text>
                        <Text size="sm" c="dimmed">
                          {gym.statistics.totalMembers} / {gym.subscription.maxMembers} members
                        </Text>
                      </Grid.Col>
                    )}
                  </Grid>
                </Accordion.Panel>
              </Accordion.Item>
            )}
          </Accordion>

          {/* Account Information */}
          <Paper p="md" withBorder>
            <Text size="lg" fw={500} mb="md">Account Information</Text>
            <Grid>
              <Grid.Col span={6}>
                <Group gap="xs" mb="sm">
                  <IconCalendar size="1rem" color="var(--mantine-color-blue-6)" />
                  <Text size="sm" fw={500}>Created</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  {new Date(gym.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Group gap="xs" mb="sm">
                  <IconCalendar size="1rem" color="var(--mantine-color-blue-6)" />
                  <Text size="sm" fw={500}>Last Updated</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  {new Date(gym.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </Grid.Col>
            </Grid>
          </Paper>
        </Stack>
      </ScrollArea>
    </Modal>
  );
}