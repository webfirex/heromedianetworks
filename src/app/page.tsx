// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';

import { createTheme, MantineProvider } from '@mantine/core';
// import PublisherSignup from './signup/page';
import HomePage from './home/page';

const theme = createTheme({
  /** Put your mantine theme override here */
});

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <HomePage/>
    </MantineProvider>
  );
}