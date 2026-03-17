import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useAppStore } from './state/appStore';
import { ensureAppDirs, loadConfig, listCollections, listTemplates } from './services/storageService';
import { checkCopilotCli } from './services/copilotService';
import { DEFAULT_COPILOT_CONFIG } from './domain';
import { colors, spacing, font, radius, transition } from './ui/theme';

/** Toast overlay shown at the bottom of the screen */
function Toast() {
  const { toastMessage, clearToast } = useAppStore();
  if (!toastMessage) return null;

  return (
    <div
      onClick={clearToast}
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: colors.bg.elevated,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radius.md,
        padding: `${spacing.sm} ${spacing.xl}`,
        fontSize: font.size.md,
        color: colors.text.primary,
        boxShadow: '0 8px 24px rgba(0,0,0,.5)',
        zIndex: 9999,
        cursor: 'pointer',
        transition: `all ${transition.normal}`,
      }}
    >
      {toastMessage}
    </div>
  );
}

export default function App() {
  const { setGithubToken, setCollections, setTemplates, setActiveCollectionId,
    setCopilotAvailable, setCopilotVersion, setCopilotEnabled, setCopilotModel, setCopilotByok, setCopilotCliPath,
  } = useAppStore();

  /** Bootstrap on first load */
  useEffect(() => {
    (async () => {
      try {
        await ensureAppDirs();
        const config = await loadConfig();
        if (config.githubToken) setGithubToken(config.githubToken as string);

        // Restore saved Copilot config
        const cc = config.copilot ?? DEFAULT_COPILOT_CONFIG;
        setCopilotEnabled(cc.enabled);
        setCopilotModel(cc.model);
        setCopilotByok(cc.byok);
        setCopilotCliPath(cc.cliPath);

        // Non-blocking CLI detection
        checkCopilotCli(cc.cliPath).then((status) => {
          setCopilotAvailable(status.available);
          setCopilotVersion(status.version);
        }).catch(() => {});

        const cols = await listCollections();
        setCollections(cols);

        if (cols.length > 0) {
          setActiveCollectionId(cols[0].id);
          const tpls = await listTemplates(cols[0].path);
          setTemplates(tpls);
        }
      } catch (err) {
        console.error('Bootstrap error:', err);
      }
    })();
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toast />
    </>
  );
}
