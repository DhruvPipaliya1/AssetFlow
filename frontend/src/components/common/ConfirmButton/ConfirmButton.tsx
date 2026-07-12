import type { ReactNode } from 'react';
import { Button, Popconfirm, type ButtonProps } from 'antd';

export interface ConfirmButtonProps extends Omit<ButtonProps, 'onClick'> {
  confirmTitle: string;
  onConfirm: () => void;
  children: ReactNode;
}

// Button gated by a confirmation popover — reuse for destructive/irreversible
// actions (delete, cancel, close cycle, etc.).
export function ConfirmButton({ confirmTitle, onConfirm, children, ...buttonProps }: ConfirmButtonProps) {
  return (
    <Popconfirm title={confirmTitle} onConfirm={onConfirm} okText="Yes" cancelText="No">
      <Button {...buttonProps}>{children}</Button>
    </Popconfirm>
  );
}
