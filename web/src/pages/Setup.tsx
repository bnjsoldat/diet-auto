import { useNavigate } from 'react-router-dom';
import { track } from '@vercel/analytics';
import { ProfileForm } from '@/components/ProfileForm';
import { useProfile } from '@/store/useProfile';

export function Setup() {
  const createProfile = useProfile((s) => s.createProfile);
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Crée ton profil</h1>
        <p className="muted mt-1">
          Tes informations servent à calculer ton besoin calorique et tes macros cibles. Elles sont
          sauvegardées dans ton compte (sync multi-appareil).
        </p>
      </div>

      <ProfileForm
        submitLabel="Créer le profil"
        onSubmit={async (data) => {
          await createProfile(data);
          // Event custom pour suivre le funnel d'onboarding
          track('profile_created', {
            activite: data.activite,
            objectif: data.objectif,
            genre: data.genre,
          });
          navigate('/today');
        }}
        onCancel={() => navigate('/')}
      />
    </div>
  );
}
