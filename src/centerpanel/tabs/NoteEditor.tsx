import styles from "../styles/note.module.css";
import type { NoteSlots } from "./Note";

export function NoteEditor(props: {
  value: NoteSlots;
  onChange: (next: NoteSlots) => void;
  readOnly?: boolean;
  slotOrder?: Array<keyof NoteSlots>;
}) {
  const { value, onChange, readOnly, slotOrder = ["objective", "methodology", "findings", "recommendations", "dataRefs", "limitations"] } = props;
  const fields: Array<{ key: keyof NoteSlots; label: string; placeholder: string }> = [
    { key: "objective", label: "Objective", placeholder: "What we're analyzing — research question, study scope…" },
    { key: "methodology", label: "Methodology", placeholder: "How we're doing it — methods, tools, workflows…" },
    { key: "findings", label: "Findings", placeholder: "Key results — metrics, patterns, spatial analysis outputs…" },
    { key: "recommendations", label: "Recommendations", placeholder: "Policy / design recommendations based on analysis…" },
    { key: "dataRefs", label: "Data References", placeholder: "Datasets used with citations and sources…" },
    { key: "limitations", label: "Limitations", placeholder: "Caveats, uncertainty, data quality notes…" },
  ];
  const ordered = fields.filter((field) => (slotOrder as string[]).includes(field.key)).sort(
    (left, right) => slotOrder.indexOf(left.key) - slotOrder.indexOf(right.key),
  );

  return (
    <div className={styles.noteEditor}>
      {ordered.map(({ key, label, placeholder }) => (
        <div key={key} className={styles.noteEditorField}>
          <div className={styles.noteEditorLabel}>{label}</div>
          <textarea
            aria-label={label}
            placeholder={placeholder}
            value={(value[key] ?? "") as string}
            onChange={(event) => onChange({ ...value, [key]: event.target.value })}
            readOnly={readOnly}
            className={styles.noteEditorTextarea}
          />
        </div>
      ))}
    </div>
  );
}