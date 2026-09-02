import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import Button from '../atoms/Button';

describe('Button Component', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <ThemeProvider initialTheme="light">
        <Button onPress={() => {}}>Press Me</Button>
      </ThemeProvider>,
    );

    expect(getByText('Press Me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <ThemeProvider initialTheme="light">
        <Button onPress={mockPress}>Press Me</Button>
      </ThemeProvider>,
    );

    fireEvent.press(getByText('Press Me'));
    expect(mockPress).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <ThemeProvider initialTheme="light">
        <Button onPress={mockPress} disabled>
          Press Me
        </Button>
      </ThemeProvider>,
    );

    fireEvent.press(getByText('Press Me'));
    expect(mockPress).not.toHaveBeenCalled();
  });

  it('should render different variants', () => {
    const { getByText: getByText1 } = render(
      <ThemeProvider initialTheme="light">
        <Button variant="filled" onPress={() => {}}>
          Filled
        </Button>
      </ThemeProvider>,
    );

    const { getByText: getByText2 } = render(
      <ThemeProvider initialTheme="light">
        <Button variant="outline" onPress={() => {}}>
          outline
        </Button>
      </ThemeProvider>,
    );

    expect(getByText1('Filled')).toBeTruthy();
    expect(getByText2('outline')).toBeTruthy();
  });
});
