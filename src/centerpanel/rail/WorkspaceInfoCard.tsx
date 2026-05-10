import React from "react";
import railStyles from "./rail.module.css";

interface WorkspaceInfoCardProps {
  title: string;
  description: string;
  bullets: string[];
  accent?: boolean;
}

export default function WorkspaceInfoCard({
  title,
  description,
  bullets,
  accent = false,
}: WorkspaceInfoCardProps): React.ReactElement {
  return (
    <aside className={railStyles.leftRailRoot}>
      <div className={`${railStyles.workspaceCard} ${accent ? railStyles.workspaceCardAccent : ""}`.trim()}>
        <div className={railStyles.workspaceTitle}>{title}</div>
        <p className={railStyles.workspaceDescription}>{description}</p>
        <ul className={railStyles.workspaceList}>
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}