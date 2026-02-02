import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import AIAssistantChat from "./AIAssistantChat";

const SparkleIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <path d="M12 3L14.5 8.5L20 9L16 13.5L17 19L12 16L7 19L8 13.5L4 9L9.5 8.5L12 3Z" />
  </svg>
);

const CloseIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface AIAssistantButtonProps {
  context?: {
    type: "customer";
    customerId: string;
    customerName: string;
  };

  /**
   * Quando true, o chat já abre ao montar.
   * Útil quando acionado dentro do detalhe do cliente.
   */
  defaultOpen?: boolean;

  /**
   * Callback para o pai desmontar o botão/portal (ex: ao fechar o chat no detalhe do cliente).
   */
  onDismiss?: () => void;
}

export default function AIAssistantButton(props: AIAssistantButtonProps = {}) {
  const { context, defaultOpen = false, onDismiss } = props;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setIsOpen(true);
  }, [defaultOpen]);

  // Renderizar via portal para garantir que fique sempre no topo
  const buttonContent = (
    <>
      {/* Floating Button - usando portal para evitar problemas de z-index */}
      <motion.button
        onClick={() => {
          if (isOpen && onDismiss) {
            setIsOpen(false);
            onDismiss();
            return;
          }
          setIsOpen(!isOpen);
        }}
        className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ position: 'fixed' }} // Força posição fixa
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CloseIcon />
            </motion.div>
          ) : (
            <motion.div
              key="sparkle"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SparkleIcon />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pulse animation when closed */}
        {!isOpen && (
          <motion.span
            className="absolute inset-0 rounded-full bg-purple-500"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <AIAssistantChat
            onClose={() => {
              setIsOpen(false);
              onDismiss?.();
            }}
            context={context}
          />
        )}
      </AnimatePresence>
    </>
  );

  // Usar portal para renderizar fora da hierarquia do DOM
  if (typeof document !== 'undefined') {
    return createPortal(buttonContent, document.body);
  }

  return buttonContent;
}
