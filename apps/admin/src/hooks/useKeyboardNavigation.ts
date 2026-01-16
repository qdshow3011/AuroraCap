import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface UseKeyboardNavigationProps {
  routes: string[];
  enabled?: boolean;
}

export const useKeyboardNavigation = ({ routes, enabled = true }: UseKeyboardNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = routes.indexOf(location.pathname);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          nextIndex = (currentIndex - 1 + routes.length) % routes.length;
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          nextIndex = (currentIndex + 1) % routes.length;
          break;
        default:
          return;
      }

      e.preventDefault();
      navigate(routes[nextIndex]);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [location.pathname, navigate, routes, enabled]);
};
