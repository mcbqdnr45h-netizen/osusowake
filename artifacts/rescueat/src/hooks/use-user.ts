import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      let id = localStorage.getItem('rescueat_user_id');
      if (!id) {
        id = uuidv4();
        localStorage.setItem('rescueat_user_id', id);
      }
      setUserId(id);
    } catch (err) {
      console.error("Failed to access localStorage", err);
      setUserId(uuidv4()); // Fallback for incognito
    }
  }, []);

  return userId;
}
