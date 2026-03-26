import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function StoreLogin() {
  const [, navigate] = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    const dest = redirect
      ? `/login?tab=store&redirect=${encodeURIComponent(redirect)}`
      : '/login?tab=store';
    navigate(dest, { replace: true });
  }, [navigate]);
  return null;
}
