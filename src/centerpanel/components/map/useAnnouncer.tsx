import React, { useCallback, useRef, useState } from "react";

/* ================================================================== */
/*  Screen Reader Announcements — aria-live region                     */
/*  Usage:                                                             */
/*    const { announce, AnnouncerRegion } = useAnnouncer();            */
/*    announce("Pin added: Istanbul Old City");                        */
/*    <AnnouncerRegion />    // place once in modal                    */
/* ================================================================== */

/** Visually-hidden style (visible to screen readers). */
const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

export interface AnnouncerAPI {
  /** Push a message to the aria-live region. */
  announce: (message: string) => void;
  /** React component — render once inside the modal. */
  AnnouncerRegion: React.FC;
}

export function useAnnouncer(): AnnouncerAPI {
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((msg: string) => {
    /* Clear then set — guarantees screen reader re-reads duplicate messages */
    setMessage("");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(msg), 50);
  }, []);

  const AnnouncerRegion: React.FC = useCallback(
    () => (
      <div aria-live="polite" aria-atomic="true" role="status" style={srOnly}>
        {message}
      </div>
    ),
    [message],
  );

  return { announce, AnnouncerRegion };
}
