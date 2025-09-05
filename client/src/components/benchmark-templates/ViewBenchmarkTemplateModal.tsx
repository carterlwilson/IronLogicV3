'use client';

import {
  Modal,
  Text,
  Badge,
  Stack,
  Group,
  Button,
  Divider,
  Card
} from '@mantine/core';
import { IconCalendar, IconUser, IconEdit } from '@tabler/icons-react';
import { type BenchmarkTemplate } from '../../lib/benchmark-templates-api';

interface ViewBenchmarkTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onEdit?: (template: BenchmarkTemplate) => void;
  template: BenchmarkTemplate | null;
}

export function ViewBenchmarkTemplateModal({
  opened,
  onClose,
  onEdit,
  template
}: ViewBenchmarkTemplateModalProps) {
  const handleEdit = () => {
    if (template && onEdit) {
      onEdit(template);
      onClose();
    }
  };

  if (!template) return null;

  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Benchmark Template Details"
      size="lg"
      centered
    >
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Group gap="sm" align="center" mb="xs">
              <Text size="xl" fw={600}>{template.name}</Text>
            </Group>
            
            {template.description && (
              <Text c="dimmed" size="sm">
                {template.description}
              </Text>
            )}
          </div>
          
          {onEdit && (
            <Button
              leftSection={<IconEdit size="1rem" />}
              variant="light"
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
        </Group>

        <Divider />

        {/* Template Details */}
        <Stack gap="md">
          <Card p="md" withBorder>
            <Stack gap="sm">
              <Text size="sm" fw={500} c="dimmed">MEASUREMENT DETAILS</Text>
              
              <Group>
                <Group gap="xs">
                  <Text size="sm" c="dimmed">Type:</Text>
                  <Badge variant="outline" color="blue">
                    {template.type}
                  </Badge>
                </Group>
                
                <Group gap="xs">
                  <Text size="sm" c="dimmed">Unit:</Text>
                  <Badge variant="outline" color="green">
                    {template.unit}
                  </Badge>
                </Group>
              </Group>
            </Stack>
          </Card>

          {template.instructions && (
            <Card p="md" withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={500} c="dimmed">INSTRUCTIONS</Text>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {template.instructions}
                </Text>
              </Stack>
            </Card>
          )}

          {template.notes && (
            <Card p="md" withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={500} c="dimmed">NOTES</Text>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {template.notes}
                </Text>
              </Stack>
            </Card>
          )}

          {template.tags.length > 0 && (
            <Card p="md" withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={500} c="dimmed">TAGS</Text>
                <Group gap="xs">
                  {template.tags.map((tag, index) => (
                    <Badge key={index} size="sm" variant="dot">
                      {tag}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </Card>
          )}

          {/* Metadata */}
          <Card p="md" withBorder>
            <Stack gap="sm">
              <Text size="sm" fw={500} c="dimmed">METADATA</Text>
              
              <Group gap="md">
                <Group gap="xs">
                  <IconCalendar size="1rem" color="var(--mantine-color-dimmed)" />
                  <div>
                    <Text size="xs" c="dimmed">Created</Text>
                    <Text size="sm">{formatDate(template.createdAt)}</Text>
                  </div>
                </Group>
                
                {template.updatedAt !== template.createdAt && (
                  <Group gap="xs">
                    <IconCalendar size="1rem" color="var(--mantine-color-dimmed)" />
                    <div>
                      <Text size="xs" c="dimmed">Last Updated</Text>
                      <Text size="sm">{formatDate(template.updatedAt)}</Text>
                    </div>
                  </Group>
                )}
                
                {template.createdBy && (
                  <Group gap="xs">
                    <IconUser size="1rem" color="var(--mantine-color-dimmed)" />
                    <div>
                      <Text size="xs" c="dimmed">Created By</Text>
                      <Text size="sm">{template.createdBy.name}</Text>
                    </div>
                  </Group>
                )}
              </Group>
            </Stack>
          </Card>
        </Stack>

        {/* Footer */}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}