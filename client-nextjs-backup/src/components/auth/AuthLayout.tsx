import { Container, Paper, Text, Center, Stack, Box } from '@mantine/core';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <Container size="xs" w="100%">
        <Paper
          shadow="xl"
          p="xl"
          radius="md"
          withBorder
          style={{
            backgroundColor: 'white',
            maxWidth: '400px',
            margin: '0 auto',
          }}
        >
          <Stack gap="lg">
            <Center>
              <Stack gap="xs" align="center">
                <Text
                  size="xl"
                  fw={700}
                  c="#2563eb"
                  style={{ fontSize: '1.75rem' }}
                >
                  IronLogic3
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  Gym Management System
                </Text>
              </Stack>
            </Center>

            <Stack gap="xs" align="center">
              <Text size="lg" fw={600} c="dark">
                {title}
              </Text>
              {subtitle && (
                <Text size="sm" c="dimmed" ta="center">
                  {subtitle}
                </Text>
              )}
            </Stack>

            {children}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}