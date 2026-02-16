import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './ui/layouts/AppShell';
import { StartScreen } from './features/start/StartScreen';
import { TemplatesHome } from './features/templates/TemplatesHome';
import { RepoCreator } from './features/repo/RepoCreator';
import { SettingsPage } from './features/settings/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <StartScreen /> },
      { path: 'templates', element: <TemplatesHome /> },
      { path: 'repo-creator', element: <RepoCreator /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
