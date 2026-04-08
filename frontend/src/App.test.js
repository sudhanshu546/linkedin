import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

test('renders app without crashing', () => {
  render(
    <Router>
      <App />
    </Router>
  );
});
