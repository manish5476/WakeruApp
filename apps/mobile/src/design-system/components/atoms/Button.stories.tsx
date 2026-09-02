import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import Button from '../atoms/Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['filled', 'outlined', 'text'],
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    onPress: () => alert('Button pressed'),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: 'Outlined Button',
    onPress: () => alert('Button pressed'),
  },
};

export const Text: Story = {
  args: {
    variant: 'text',
    children: 'Text Button',
    onPress: () => alert('Button pressed'),
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
    onPress: () => alert('Button pressed'),
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    children: 'Large Button',
    onPress: () => alert('Button pressed'),
  },
};
