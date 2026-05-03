interface ProfileCardProps {
  name: string;
  age: number;
  hobbies: string[];
  isOnline: boolean;
  avatarUrl?: string;
  bio?: string;
}

export function ProfileCard({ name, age, hobbies, isOnline, avatarUrl, bio }: ProfileCardProps) {
  return (
    <div>
      {/* твой код здесь */}
    </div>
  );
}

