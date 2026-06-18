import { type FC, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { css, keyframes } from 'styled-components';
import { SYNAPSE_OVERLAY } from '@/ui/theme/synapseTheme';
import { X } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useInertBackground } from '@/hooks/useInertBackground';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;

  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'palette';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventBodyScroll?: boolean;
  className?: string;

  variant?: 'default' | 'palette';

  /** Accessible name when no visible `title` is rendered. */
  ariaLabel?: string;
  /** id of an element that describes the dialog (wires `aria-describedby`). */
  describedby?: string;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Overlay = styled.div<{ $isOpen: boolean; $variant: 'default' | 'palette' }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${SYNAPSE_OVERLAY.backdrop};
  backdrop-filter: ${SYNAPSE_OVERLAY.blur};
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => (props.$variant === 'palette' ? 'clamp(48px,6vw,64px)' : 'var(--spacing-md)')};

  animation: ${fadeIn} var(--duration-medium) var(--syn-easing-bauhaus);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  ${props =>
    !props.$isOpen &&
    css`
      display: none;
    `}
`;

const ModalContainer = styled.div<{ size: string; $variant: 'default' | 'palette' }>`
  background: ${SYNAPSE_OVERLAY.surface};
  border: 1px solid
    ${props => (props.$variant === 'palette' ? 'rgba(255,255,255,0.08)' : SYNAPSE_OVERLAY.surfaceBorder)};
  border-radius: ${props => (props.$variant === 'palette' ? '6px' : 'var(--border-radius-lg)')};
  box-shadow: ${props =>
    props.$variant === 'palette'
      ? '0 14px 36px -8px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.03)'
      : SYNAPSE_OVERLAY.surfaceGlow};
  backdrop-filter: ${props => (props.$variant === 'palette' ? 'blur(10px) brightness(0.95)' : SYNAPSE_OVERLAY.blur)};
  max-height: ${props => (props.$variant === 'palette' ? '80vh' : '90vh')};
  overflow-y: auto;
  animation: ${slideUp} var(--duration-medium) var(--syn-easing-bauhaus);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  /* The dialog container is programmatically focusable as a fallback so the
     background still inerts correctly when no child is focusable. */
  &:focus-visible {
    outline: none;
  }

  font-family: var(--font-mono, var(--font-code, "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace));

  ${props => {
    switch (props.size) {
      case 'sm':
        return css`
          width: 100%;
          max-width: 400px;
        `;
      case 'md':
        return css`
          width: 100%;
          max-width: 600px;
        `;
      case 'lg':
        return css`
          width: 100%;
          max-width: 800px;
        `;
      case 'palette':
        return css`
          width: 100%;
          max-width: 960px;
          /* Reflow below 688px: cap the comfortable desktop floor at the
             available width instead of forcing a hard 640px (M9). */
          min-width: min(640px, 100%);
        `;
      case 'xl':
        return css`
          width: 100%;
          max-width: 1200px;
        `;
      case 'full':
        return css`
          width: 100%;
          height: 100%;
          max-width: none;
          max-height: none;
          border-radius: 0;
        `;
      default:
        return css`
          width: 100%;
          max-width: 600px;
        `;
    }
  }}
`;

const ModalHeader = styled.div<{ $variant: 'default' | 'palette' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${p => (p.$variant === 'palette' ? '24px 24px 16px' : 'var(--spacing-lg)')};
  border-bottom: 1px solid
    ${p => (p.$variant === 'palette' ? 'rgba(255,255,255,0.06)' : 'var(--color-border)')};
  font-family: inherit;
`;

const ModalTitle = styled.h2<{ $variant: 'default' | 'palette' }>`
  margin: 0;
  font-size: ${p => (p.$variant === 'palette' ? '18px' : 'var(--font-size-lg)')};
  font-weight: ${p => (p.$variant === 'palette' ? 600 : 'var(--font-weight-semibold)')};
  color: var(--color-text);
  font-family: var(--font-mono, var(--font-code, 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace));
`;

const ModalContent = styled.div<{ $variant: 'default' | 'palette' }>`
  padding: ${p => (p.$variant === 'palette' ? '0 24px 24px' : 'var(--spacing-lg)')};
  font-family: inherit;
`;

const VisuallyHidden = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  preventBodyScroll = true,
  className,
  variant = 'default',
  ariaLabel,
  describedby,
}) => {
  const titleId = useId();
  const openerRef = useRef<HTMLElement | null>(null);
  const { trapRef, activate } = useFocusTrap(isOpen);
  const [announcement, setAnnouncement] = useState('');

  // Body scroll-lock + background inerting via the shared foundation hooks.
  // useInertBackground is declared AFTER the focus-move layout effect so it
  // anchors on an element inside the dialog (the app behind it is inerted), and
  // its cleanup runs BEFORE the focus-restore effect below (so the opener is no
  // longer in an inert subtree when we restore focus on close).
  useScrollLock(isOpen && preventBodyScroll);

  // Capture the opener and move initial focus into the dialog. A layout effect
  // runs before passive effects, so focus is inside the dialog by the time
  // useInertBackground's passive effect computes which branch to keep live.
  useLayoutEffect(() => {
    if (!isOpen) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    activate();
    const container = trapRef.current;
    if (container && (!document.activeElement || !container.contains(document.activeElement))) {
      container.focus();
    }
  }, [isOpen, activate, trapRef]);

  useInertBackground(isOpen);

  // Restore focus to the opener on close. Declared after useInertBackground so
  // this cleanup runs after the background is un-inerted.
  useEffect(() => {
    if (!isOpen) return undefined;
    return () => {
      const opener = openerRef.current;
      openerRef.current = null;
      if (opener && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [isOpen]);

  // Polite live-region announcement when the dialog opens (M7).
  useEffect(() => {
    if (!isOpen) {
      setAnnouncement('');
      return undefined;
    }
    const label = title ?? ariaLabel ?? 'Dialog';
    const timer = window.setTimeout(() => setAnnouncement(`${label} dialog opened`), 50);
    return () => {
      window.clearTimeout(timer);
      setAnnouncement('');
    };
  }, [isOpen, title, ariaLabel]);

  if (!isOpen) {
    return null;
  }

  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const onOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (closeOnEscape && e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };

  const modalContent = (
    <Overlay $isOpen={isOpen} $variant={variant} onClick={onOverlayClick} onKeyDown={onOverlayKeyDown}>
      <ModalContainer
        ref={trapRef}
        size={size}
        $variant={variant}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        aria-describedby={describedby}
        tabIndex={-1}
      >
        {(title || showCloseButton) ? <ModalHeader $variant={variant}>
            {title ? <ModalTitle id={titleId} $variant={variant}>{title}</ModalTitle> : null}
            {showCloseButton ? <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                icon={<X size={16} />}
                aria-label="Close modal"
              /> : null}
          </ModalHeader> : null}

        <ModalContent $variant={variant}>{children}</ModalContent>
      </ModalContainer>
      <VisuallyHidden role="status" aria-live="polite">{announcement}</VisuallyHidden>
    </Overlay>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
