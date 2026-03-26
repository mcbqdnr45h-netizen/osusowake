import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function StoreSignUp() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate('/signup?tab=store', { replace: true });
  }, [navigate]);
  return null;
}
