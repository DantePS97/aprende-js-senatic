import { PushPreferenceToggle } from './_components/PushPreferenceToggle';
import { PushOptInBanner } from '@/components/notifications/PushOptInBanner';

export const metadata = { title: 'Notificaciones' };

export default function NotificationsSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Notificaciones</h1>

      {/* Banner de opt-in si aún no están activadas */}
      <PushOptInBanner ignoreSuppressionWindow />

      <div className="card divide-y divide-slate-700/60">
        <PushPreferenceToggle
          type="achievement_unlocked"
          label="Logros"
          description="Recibe una notificación cada vez que desbloquees un nuevo logro."
        />
        <PushPreferenceToggle
          type="level_up"
          label="Subida de nivel"
          description="Entérate cuando alcances un nuevo nivel en tu progreso."
        />
        <PushPreferenceToggle
          type="streak_reminder"
          label="Racha en riesgo"
          description="Recibe un aviso cuando tu racha diaria esté a punto de perderse."
        />
      </div>
    </div>
  );
}
