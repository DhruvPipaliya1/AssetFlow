import { Steps } from 'antd';

export interface WorkflowStepDef {
  key: string; // a status value (e.g. 'PENDING')
  title: string; // human label
}

export interface WorkflowStepsProps {
  /** Ordered lifecycle steps (the "happy path"). */
  steps: WorkflowStepDef[];
  /** The current status value — matched against step.key. */
  current: string;
  /** Render the current step as an error (e.g. REJECTED / CANCELLED). */
  error?: boolean;
  size?: 'default' | 'small';
  direction?: 'horizontal' | 'vertical';
}

// Shared lifecycle visual for maintenance / transfer / audit flows — always
// render workflow progress through this, never ad-hoc. Maps a status value onto
// an antd <Steps> position so every workflow reads consistently.
export function WorkflowSteps({
  steps,
  current,
  error = false,
  size = 'small',
  direction = 'horizontal',
}: WorkflowStepsProps) {
  const index = steps.findIndex((s) => s.key === current);
  const currentIndex = index === -1 ? 0 : index;
  return (
    <Steps
      size={size}
      direction={direction}
      current={currentIndex}
      status={error ? 'error' : currentIndex === steps.length - 1 ? 'finish' : 'process'}
      items={steps.map((s) => ({ title: s.title }))}
    />
  );
}
