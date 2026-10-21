import { useState, useMemo } from 'react';

export const useAvisoPrivacidad = (role) => {
  const isEmployee = role !== 'admin';

  const [isOpen, setIsOpen] = useState(false);
  const [accepted, setAccepted] = useState(
    () => localStorage.getItem('privacyAccepted') === 'true'
  );

  const shouldShowModal = useMemo(() => isEmployee, [isEmployee]);

  const openModal = () => setIsOpen(true);

  const closeModal = () => {
    setIsOpen(false);
    // no reiniciar localStorage aquí; solo cierra el modal
  };

  const accept = () => {
    localStorage.setItem('privacyAccepted', 'true');
    setAccepted(true);
    setIsOpen(false);
  };

  return {
    isOpen,
    accepted,
    shouldShowModal,
    openModal,
    closeModal,
    accept,
    setAccepted
  };
};