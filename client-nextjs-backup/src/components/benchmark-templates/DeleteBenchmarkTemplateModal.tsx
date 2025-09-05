'use client';

import {
  Modal,
  Text,
  Button,
  Group,
  Stack,
  Badge,
  Alert
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { BenchmarkTemplate } from '../../lib/benchmark-templates-api';

interface DeleteBenchmarkTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean>;
  template: BenchmarkTemplate | null;
  loading: boolean;
}

export function DeleteBenchmarkTemplateModal({
  opened,
  onClose,
  onConfirm,
  template,
  loading
}: DeleteBenchmarkTemplateModalProps) {
  const handleConfirm = async () => {
    if (!template) return;
    
    const success = await onConfirm(template._id);
    if (success) {
      onClose();
    }
  };

  if (!template) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Benchmark Template"
      centered
      size="md"
    >
      <Stack gap="md">
        <Alert
          icon={<IconAlertTriangle size="1rem" />}
          title="Warning"
          color="red"
          variant="light"
        >
          This action cannot be undone. The benchmark template will be permanently deleted.
        </Alert>

        <Stack gap="xs">
          <Text size="sm" c="dimmed">You are about to delete:</Text>
          
          <Group gap="xs" align="center">
            <Text fw={500} size="lg">{template.name}</Text>
          </Group>

          {template.description && (
            <Text size="sm" c="dimmed" lineClamp={2}>
              {template.description}
            </Text>
          )}

          <Group gap="xs">
            <Text size="sm" c="dimmed">Type:</Text>
            <Badge size="sm" variant="outline">
              {template.type}
            </Badge>
          </Group>

          <Group gap="xs">
            <Text size="sm" c="dimmed">Unit:</Text>
            <Badge size="sm" variant="outline">
              {template.unit}
            </Badge>
          </Group>

          {template.tags.length > 0 && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">Tags:</Text>
              <Group gap="xs">
                {template.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} size="xs" variant="dot">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge size="xs" variant="light" color="gray">
                    +{template.tags.length - 3} more
                  </Badge>
                )}
              </Group>
            </Group>
          )}
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleConfirm}
            loading={loading}
          >
            Delete Template
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}