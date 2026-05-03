import { useState } from 'react';

interface PersonalData {
  firstName: string;
  lastName: string;
  birthDate: string;
}

interface AccountData {
  email: string;
  password: string;
  confirmPassword: string;
}

type Step = 1 | 2 | 3;

export function RegistrationForm() {
  const [step, setStep] = useState<Step>(1);
  const [personal, setPersonal] = useState<PersonalData>({ firstName: '', lastName: '', birthDate: '' });
  const [account, setAccount] = useState<AccountData>({ email: '', password: '', confirmPassword: '' });
  const [agreed, setAgreed] = useState(false);

  return (
    <div>
      {/* твой код здесь */}
    </div>
  );
}
