// src/features/auth/SocialAuthButton.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { FcGoogle } from "react-icons/fc";
import { SiGithub } from "react-icons/si";

interface Props {
  provider: 'google' | 'github';
  url: string;
}

const labels = {
  google: 'Continue with Google',
  github: 'Continue with GitHub',
};

const icons = {
  google: <FcGoogle size={18} />,
  github: <SiGithub size={18} />,
};

export const SocialAuthButton: React.FC<Props> = ({ provider, url }) => (
  <Button
    onClick={() => (window.location.href = url)}
    className="w-full flex items-center justify-center space-x-0 sm:space-x-2 focus:ring-2"
    aria-label={labels[provider]}
  >
    {icons[provider]}
    <span>{labels[provider]}</span>
  </Button>
);
