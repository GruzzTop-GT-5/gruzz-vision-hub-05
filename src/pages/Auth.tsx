import React from 'react';
import { AuthForm } from '@/components/AuthForm';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/', { replace: true });
  };

  const handleBack = () => {
    navigate('/', { replace: true });
  };

  return (
    <AuthForm 
      onSuccess={handleSuccess} 
      onBack={handleBack}
    />
  );
};

export default Auth;