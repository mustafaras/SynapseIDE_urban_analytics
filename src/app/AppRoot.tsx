import App from '@/App';
import Toaster from '@/ui/toast/Toaster';

export function AppRoot() {
  return (
    <div data-app-shell="root">
      <div data-app-shell="frame">
        <App />
      </div>
      <Toaster />
    </div>
  );
}

export default AppRoot;
