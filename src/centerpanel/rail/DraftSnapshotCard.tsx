
import { useNewProjectDraftStore } from "../../stores/useNewProjectDraftStore";
import styles from "./rail.module.css";

export default function DraftSnapshotCard() {
  const name = useNewProjectDraftStore((s) => s.name);
  const description = useNewProjectDraftStore((s) => s.description);
  const scale = useNewProjectDraftStore((s) => s.scale);
  const crs = useNewProjectDraftStore((s) => s.crs);
  const tags = useNewProjectDraftStore((s) => s.tags);

  const nameDisplay = (name || "").trim() || "—";
  const descDisplay = (description || "").trim() || "—";
  const scaleDisplay = scale || "—";

  return (
    <div className={styles.snapshotCard}>
      <div className={styles.snapshotHeader}>
        <div className={styles.snapshotName}>{nameDisplay}</div>
        <div className={styles.snapshotProjectRef}>{scaleDisplay} · {crs}</div>
      </div>

      <div className={styles.snapshotSection}>
        <div className={styles.snapshotSectionLabel}>Description</div>
        <div className={styles.snapshotListItem}>
          <div className={styles.snapshotListMain}>{descDisplay}</div>
        </div>
      </div>

      <div className={styles.snapshotSection}>
        <div className={styles.snapshotSectionLabel}>Tags</div>
        {tags.length === 0 ? (
          <div className={styles.snapshotEmpty}>No tags added</div>
        ) : (
          <div className={styles.snapshotListItem}>
            <div className={styles.snapshotListMain}>
              {tags.join(" · ")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
