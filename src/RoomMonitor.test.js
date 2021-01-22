import { render, screen } from '@testing-library/react';
import RoomMonitor from './RoomMonitor';

test('renders learn react link', () => {
  render(<RoomMonitor />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
