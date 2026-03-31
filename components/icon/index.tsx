import { ProjectIcon } from '@/components/_shared/project-icon';
import styles from './styles.module.css';

export default function Icon({
  props,
  style
}: {
  props?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const label = typeof props?.label === 'string' ? props.label : undefined;

  return (
    <ProjectIcon
      className={styles.icon}
      name={props?.name}
      size={props?.size}
      color={props?.color}
      label={label}
      customSvg={props?.customSvg}
      strokeWidth={typeof props?.strokeWidth === 'number' ? props.strokeWidth : undefined}
      style={style}
    />
  );
}
