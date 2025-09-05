'use client';

import { type ReactNode } from 'react';
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Avatar,
  Menu,
  Text,
  Button,
  ScrollArea,
  Divider,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconDashboard,
  IconUsers,
  IconBuilding,
  IconBarbell,
  IconCalendarEvent,
  IconTrophy,
  IconSettings,
  IconChevronDown,
  IconLogout,
  IconUser,
  IconDeviceMobile,
  IconActivity,
} from '@tabler/icons-react';
import { useAuth } from '../../lib/auth-context';
import { useNavigate } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  icon: ReactNode;
  label: string;
  href: string;
  badge?: string;
  disabled?: boolean;
}

const getNavigationItems = (userType: string): NavigationItem[] => {
  const baseItems: NavigationItem[] = [
    {
      icon: <IconDashboard size="1.1rem" />,
      label: 'Dashboard',
      href: '/dashboard',
    },
  ];

  switch (userType) {
    case 'admin':
      return [
        ...baseItems,
        {
          icon: <IconUsers size="1.1rem" />,
          label: 'Users',
          href: '/users',
        },
        {
          icon: <IconBuilding size="1.1rem" />,
          label: 'Gyms',
          href: '/gyms',
        },
        {
          icon: <IconActivity size="1.1rem" />,
          label: 'Activities',
          href: '/activities',
        },
        {
          icon: <IconBarbell size="1.1rem" />,
          label: 'Activity Groups',
          href: '/activity-groups',
        },
        {
          icon: <IconTrophy size="1.1rem" />,
          label: 'Benchmark Templates',
          href: '/benchmark-templates',
        },
        {
          icon: <IconBarbell size="1.1rem" />,
          label: 'Programs',
          href: '/programs',
        },
        {
          icon: <IconCalendarEvent size="1.1rem" />,
          label: 'Schedules',
          href: '/schedules',
        },
        {
          icon: <IconTrophy size="1.1rem" />,
          label: 'Benchmarks',
          href: '/benchmarks',
        },
        {
          icon: <IconSettings size="1.1rem" />,
          label: 'Settings',
          href: '/settings',
        },
      ];

    case 'gym_owner':
      return [
        ...baseItems,
        {
          icon: <IconUsers size="1.1rem" />,
          label: 'Clients',
          href: '/gym/users',
        },
        {
          icon: <IconBuilding size="1.1rem" />,
          label: 'My Gym',
          href: '/gym/details',
        },
        {
          icon: <IconActivity size="1.1rem" />,
          label: 'Activities',
          href: '/activities',
        },
        {
          icon: <IconBarbell size="1.1rem" />,
          label: 'Activity Groups',
          href: '/activity-groups',
        },
        {
          icon: <IconTrophy size="1.1rem" />,
          label: 'Benchmark Templates',
          href: '/benchmark-templates',
        },
        {
          icon: <IconBarbell size="1.1rem" />,
          label: 'Programs',
          href: '/programs',
        },
        {
          icon: <IconCalendarEvent size="1.1rem" />,
          label: 'Schedules',
          href: '/schedules',
        },
        {
          icon: <IconTrophy size="1.1rem" />,
          label: 'Benchmarks',
          href: '/benchmarks',
        },
        {
          icon: <IconSettings size="1.1rem" />,
          label: 'Settings',
          href: '/settings',
        },
      ];

    case 'coach':
      return [
        ...baseItems,
        {
          icon: <IconActivity size="1.1rem" />,
          label: 'Activities',
          href: '/activities',
        },
        {
          icon: <IconBarbell size="1.1rem" />,
          label: 'Activity Groups',
          href: '/activity-groups',
        },
        {
          icon: <IconTrophy size="1.1rem" />,
          label: 'Benchmark Templates',
          href: '/benchmark-templates',
        },
        {
          icon: <IconBarbell size="1.1rem" />,
          label: 'My Programs',
          href: '/coach/programs',
        },
        {
          icon: <IconCalendarEvent size="1.1rem" />,
          label: 'My Schedule',
          href: '/coach/schedule',
        },
        {
          icon: <IconUsers size="1.1rem" />,
          label: 'My Clients',
          href: '/coach/clients',
        },
        {
          icon: <IconTrophy size="1.1rem" />,
          label: 'Client Benchmarks',
          href: '/coach/benchmarks',
        },
        {
          icon: <IconSettings size="1.1rem" />,
          label: 'Settings',
          href: '/settings',
        },
      ];

    case 'client':
      // Clients should be redirected to mobile interface
      return [
        {
          icon: <IconDeviceMobile size="1.1rem" />,
          label: 'Mobile App',
          href: '/mobile',
        },
      ];

    default:
      return baseItems;
  }
};

const getUserTypeDisplay = (userType: string): { label: string; color: string } => {
  switch (userType) {
    case 'admin':
      return { label: 'Admin', color: 'red' };
    case 'gym_owner':
      return { label: 'Gym Owner', color: 'blue' };
    case 'coach':
      return { label: 'Coach', color: 'green' };
    case 'client':
      return { label: 'Client', color: 'orange' };
    default:
      return { label: 'User', color: 'gray' };
  }
};

export function AppLayout({ children }: AppLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const navigationItems = getNavigationItems(user.userType);
  const userDisplay = getUserTypeDisplay(user.userType);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    close();
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened, desktop: false },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Text fw={700} size="lg" c="blue">
              IronLogic3
            </Text>
          </Group>

          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <Button variant="subtle" leftSection={
                <Avatar size={30} color="blue">
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              } rightSection={<IconChevronDown size="1rem" />}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {user.name}
                  </div>
                  <Badge size="xs" color={userDisplay.color} variant="light">
                    {userDisplay.label}
                  </Badge>
                </div>
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconUser size="1rem" />}
                onClick={() => navigate('/profile')}
              >
                Profile
              </Menu.Item>
              <Menu.Item
                leftSection={<IconSettings size="1rem" />}
                onClick={() => navigate('/settings')}
              >
                Settings
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconLogout size="1rem" />}
                color="red"
                onClick={handleLogout}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <div>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="sm">
              Navigation
            </Text>
            {navigationItems.map((item, index) => (
              <NavLink
                key={index}
                href={item.href}
                label={item.label}
                leftSection={item.icon}
                rightSection={
                  item.badge && (
                    <Badge size="xs" variant="filled" color="blue">
                      {item.badge}
                    </Badge>
                  )
                }
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation(item.href);
                }}
                disabled={item.disabled || false}
                mb="xs"
              />
            ))}
          </div>

          <Divider my="md" />

          <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--mantine-color-dimmed)' }}>
            <span>Logged in as </span>
            <Badge size="xs" color={userDisplay.color} variant="light">
              {userDisplay.label}
            </Badge>
          </div>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}