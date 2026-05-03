import { ProfileCard } from '../../../01_jsx_basics/solution/ProfileCard';

export function ProfileCardDemo() {
  return (
    <ProfileCard
      name="Алексей"
      age={25}
      hobbies={['Программирование', 'Чтение', 'Игры']}
      isOnline={true}
      bio="Fullstack разработчик, люблю TypeScript"
    />
  );
}
